import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [script, scope = "all"] = process.argv.slice(2);
if (!script || !["all", "apps", "packages"].includes(scope)) {
  console.error("Usage: node scripts/run-workspace-script.mjs <script> [all|apps|packages]");
  process.exit(2);
}

const root = process.cwd();
const roots = scope === "all" ? ["packages", "apps"] : [scope];
const workspaces = [];

for (const group of roots) {
  const directory = path.join(root, group);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(directory, entry.name, "package.json");
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      if (manifest.scripts?.[script]) workspaces.push(manifest);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

if (workspaces.length === 0) {
  console.log(`No workspaces with script "${script}" found in scope "${scope}".`);
  process.exit(0);
}

const byName = new Map(workspaces.map((manifest) => [manifest.name, manifest]));
const dependencies = new Map();
const dependents = new Map();
const indegree = new Map();

for (const manifest of workspaces) {
  const internalDependencies = Object.keys({
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
    ...(manifest.peerDependencies ?? {}),
  }).filter((name) => byName.has(name));

  dependencies.set(manifest.name, internalDependencies);
  indegree.set(manifest.name, internalDependencies.length);

  for (const dependency of internalDependencies) {
    const current = dependents.get(dependency) ?? [];
    current.push(manifest.name);
    dependents.set(dependency, current);
  }
}

const ready = [...indegree.entries()]
  .filter(([, count]) => count === 0)
  .map(([name]) => name)
  .sort();
const ordered = [];

while (ready.length > 0) {
  const workspace = ready.shift();
  ordered.push(workspace);

  for (const dependent of (dependents.get(workspace) ?? []).sort()) {
    const next = indegree.get(dependent) - 1;
    indegree.set(dependent, next);
    if (next === 0) {
      ready.push(dependent);
      ready.sort();
    }
  }
}

if (ordered.length !== workspaces.length) {
  const blocked = [...indegree.entries()]
    .filter(([, count]) => count > 0)
    .map(([name]) => name)
    .sort();
  console.error(`Workspace dependency cycle detected: ${blocked.join(", ")}`);
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
for (const workspace of ordered) {
  const result = spawnSync(npmCommand, ["-w", workspace, "run", script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}
