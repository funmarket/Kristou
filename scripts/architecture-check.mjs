import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", "dist", "coverage", ".git", ".superpowers"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const violations = [];
const importPattern = /\b(?:import|export)\b(?:[\s\S]*?\bfrom\s*)?["']([^"']+)["']/g;

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function importSpecifiers(source) {
  return [...source.matchAll(importPattern)].map((match) => match[1]);
}

function internalPackageName(specifier) {
  if (!specifier.startsWith("@kristou/")) return null;
  return specifier.split("/").slice(0, 2).join("/");
}

async function owningManifest(file) {
  const normalized = relative(file);
  const match = normalized.match(/^(apps|packages)\/([^/]+)\//);
  if (!match) return null;

  try {
    return JSON.parse(
      await readFile(path.join(root, match[1], match[2], "package.json"), "utf8"),
    );
  } catch {
    return null;
  }
}

for (const file of await walk(root)) {
  if (!sourceExtensions.has(path.extname(file))) continue;

  const normalized = relative(file);
  const source = await readFile(file, "utf8");
  const imports = importSpecifiers(source);

  if (normalized.startsWith("packages/")) {
    for (const imported of imports) {
      if (imported.includes("apps/") || /^\.\.\/\.\.\/\.\.\/apps\//.test(imported)) {
        violations.push(`${normalized}: packages must not import app source`);
      }
    }
  }

  if (normalized.startsWith("packages/domain/")) {
    for (const imported of imports) {
      if (
        imported === "@kristou/database" ||
        imported.startsWith("@kristou/database/") ||
        imported === "express" ||
        imported.includes("/http/")
      ) {
        violations.push(
          `${normalized}: domain package must stay transport/persistence independent`,
        );
      }
    }
  }

  if (normalized.startsWith("packages/frontend/") || normalized.startsWith("packages/ui/")) {
    for (const imported of imports) {
      if (
        imported === "@kristou/database" ||
        imported.startsWith("@kristou/database/") ||
        imported === "@prisma/client"
      ) {
        violations.push(`${normalized}: frontend/UI must not import database code`);
      }
    }
  }

  if (/^apps\/api\/src\/modules\/[^/]+\/domain\//.test(normalized)) {
    for (const imported of imports) {
      if (
        imported === "express" ||
        imported === "@kristou/database" ||
        imported === "@prisma/client"
      ) {
        violations.push(
          `${normalized}: API domain layer must be transport/persistence independent`,
        );
      }
    }
  }

  if (
    /^apps\/api\/src\/modules\/[^/]+\/application\//.test(normalized) &&
    imports.includes("express")
  ) {
    violations.push(`${normalized}: application layer must not depend on Express`);
  }

  if (normalized.startsWith("apps/worker/")) {
    for (const imported of imports) {
      if (imported.includes("apps/api/src") && imported.includes("/http/")) {
        violations.push(`${normalized}: worker must not import API HTTP code`);
      }
    }
  }

  if (/^apps\/api\/src\/modules\/(?:management|platform|common|shared)\//.test(normalized)) {
    violations.push(
      `${normalized}: catch-all business owner module is forbidden without an explicit architecture decision`,
    );
  }

  const manifest = await owningManifest(file);
  if (manifest) {
    const declared = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.devDependencies ?? {}),
      ...(manifest.peerDependencies ?? {}),
    };

    for (const imported of imports) {
      const internal = internalPackageName(imported);
      if (internal && internal !== manifest.name && !(internal in declared)) {
        violations.push(
          `${normalized}: imports undeclared workspace dependency ${internal}`,
        );
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    "Architecture check failed:\n" + violations.map((item) => `- ${item}`).join("\n"),
  );
  process.exit(1);
}

console.log("Architecture check passed.");
