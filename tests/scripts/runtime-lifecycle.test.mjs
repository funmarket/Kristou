import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const rootManifest = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url), "utf8"),
);
const publicTestScript = rootManifest.scripts.test;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function withLifecycleFixture({ prepareExitCode = 0 }, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "kristou-runtime-lifecycle-"));
  const traceFile = path.join(root, "trace.txt");

  try {
    await mkdir(path.join(root, "scripts"), { recursive: true });
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({
        name: "runtime-lifecycle-fixture",
        private: true,
        type: "module",
        scripts: {
          test: publicTestScript,
          "prepare:runtime": "node prepare.mjs",
          "test:unit:prepared": "node prepared-test.mjs",
        },
      }),
    );

    await writeFile(
      path.join(root, "prepare.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(process.env.TRACE_FILE, "prepare\\n");
process.exit(${prepareExitCode});
`,
    );
    await writeFile(
      path.join(root, "prepared-test.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(process.env.TRACE_FILE, "tests\\n");
`,
    );
    await writeFile(
      path.join(root, "scripts", "run-tests.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(process.env.TRACE_FILE, "tests\\n");
`,
    );

    await callback({ root, traceFile });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function readTrace(traceFile) {
  try {
    return (await readFile(traceFile, "utf8")).trim().split("\n").filter(Boolean);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

test("public unit-test lifecycle prepares runtime before tests execute", async () => {
  await withLifecycleFixture({}, async ({ root, traceFile }) => {
    const result = spawnSync(npmCommand, ["test", "--silent"], {
      cwd: root,
      env: { ...process.env, TRACE_FILE: traceFile },
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(await readTrace(traceFile), ["prepare", "tests"]);
  });
});

test("public unit-test lifecycle stops when runtime preparation fails", async () => {
  await withLifecycleFixture({ prepareExitCode: 17 }, async ({ root, traceFile }) => {
    const result = spawnSync(npmCommand, ["test", "--silent"], {
      cwd: root,
      env: { ...process.env, TRACE_FILE: traceFile },
      encoding: "utf8",
    });

    assert.notEqual(result.status, 0);
    assert.deepEqual(await readTrace(traceFile), ["prepare"]);
  });
});
