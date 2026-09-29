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
      if (manifest.scripts?.[script]) workspaces.push(manifest.name);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

if (workspaces.length === 0) {
  console.log(`No workspaces with script "${script}" found in scope "${scope}".`);
  process.exit(0);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
for (const workspace of workspaces.sort()) {
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
