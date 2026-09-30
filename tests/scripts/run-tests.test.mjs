import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const runner = fileURLToPath(new URL("../../scripts/run-tests.mjs", import.meta.url));

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "kristou-run-tests-"));
  const testsDir = path.join(root, "tests");
  const tsxDir = path.join(root, "node_modules", "tsx");

  await mkdir(testsDir, { recursive: true });
  await mkdir(tsxDir, { recursive: true });

  await writeFile(
    path.join(tsxDir, "package.json"),
    JSON.stringify({ name: "tsx", type: "module", exports: "./index.mjs" }),
  );
  await writeFile(path.join(tsxDir, "index.mjs"), "");

  await writeFile(
    path.join(testsDir, "a.integration.test.mjs"),
    `import { appendFileSync } from "node:fs";
import test from "node:test";
test("a", () => appendFileSync(process.env.KRISTOU_TEST_TRACE, "A\\n"));
`,
  );
  await writeFile(
    path.join(testsDir, "b.integration.test.mjs"),
    `import { appendFileSync } from "node:fs";
import test from "node:test";
test("b", () => appendFileSync(process.env.KRISTOU_TEST_TRACE, "B\\n"));
`,
  );

  return root;
}

async function runFixture(root, args) {
  const trace = path.join(root, "trace.txt");
  const childEnv = { ...process.env, KRISTOU_TEST_TRACE: trace };
  delete childEnv.NODE_TEST_CONTEXT;

  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: root,
    env: childEnv,
    encoding: "utf8",
  });

  const recorded = await readFile(trace, "utf8").catch(() => "");
  return { result, recorded };
}

test("optional integration test path runs only the requested test file", async () => {
  const root = await createFixture();

  try {
    const { result, recorded } = await runFixture(root, [
      "integration",
      "tests/a.integration.test.mjs",
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(recorded, "A\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("integration mode without a supplied path still runs every integration test", async () => {
  const root = await createFixture();

  try {
    const { result, recorded } = await runFixture(root, ["integration"]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(recorded.trim().split("\n").sort(), ["A", "B"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
