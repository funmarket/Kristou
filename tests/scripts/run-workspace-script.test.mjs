import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const runner = fileURLToPath(new URL("../../scripts/run-workspace-script.mjs", import.meta.url));

async function writeWorkspace(root, group, folder, manifest) {
  const directory = path.join(root, group, folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "package.json"), JSON.stringify(manifest));
}

async function createFakeNpm(root) {
  const bin = path.join(root, "bin");
  await mkdir(bin, { recursive: true });
  const npm = path.join(bin, "npm");
  await writeFile(
    npm,
    `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.KRISTOU_BUILD_TRACE, process.argv[3] + "\\n");
`,
  );
  await chmod(npm, 0o755);
  return bin;
}

test("workspace runner builds selected workspaces in internal dependency order", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "kristou-workspace-order-"));

  try {
    await writeWorkspace(root, "packages", "frontend", {
      name: "@kristou/frontend",
      scripts: { build: "echo frontend" },
      dependencies: { "@kristou/ui": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "ui", {
      name: "@kristou/ui",
      scripts: { build: "echo ui" },
    });

    const bin = await createFakeNpm(root);
    const trace = path.join(root, "trace.txt");
    const result = spawnSync(process.execPath, [runner, "build", "packages"], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        KRISTOU_BUILD_TRACE: trace,
      },
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual((await readFile(trace, "utf8")).trim().split("\n"), [
      "@kristou/ui",
      "@kristou/frontend",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
