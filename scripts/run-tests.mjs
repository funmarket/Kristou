import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "unit";
if (!["unit", "integration"].includes(mode)) {
  console.error("Usage: node scripts/run-tests.mjs <unit|integration> [test-path ...]");
  process.exit(2);
}

const root = process.cwd();
const testsRoot = path.join(root, "tests");
const requestedTests = new Set(process.argv.slice(3).map((file) => path.resolve(root, file)));
const testPattern = /\.test\.(?:ts|tsx|js|mjs)$/;
const integrationPattern = /\.integration\.test\.(?:ts|tsx|js|mjs)$/;

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
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

const allTests = (await walk(testsRoot)).filter((file) => testPattern.test(file));
const selected = allTests
  .filter((file) =>
    mode === "integration" ? integrationPattern.test(file) : !integrationPattern.test(file),
  )
  .filter((file) => requestedTests.size === 0 || requestedTests.has(path.resolve(file)))
  .sort();

if (selected.length === 0) {
  console.log(`No ${mode} tests found.`);
  process.exit(0);
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...selected], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
