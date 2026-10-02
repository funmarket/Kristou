import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const checkerSource = await readFile(
  new URL("../../scripts/architecture-check.mjs", import.meta.url),
  "utf8",
);

async function withFixture(extraFiles, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "kristou-architecture-check-"));
  try {
    await mkdir(path.join(root, "scripts"), { recursive: true });
    await writeFile(path.join(root, "scripts/architecture-check.mjs"), checkerSource);

    for (const [relative, content] of Object.entries(extraFiles)) {
      const target = path.join(root, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }

    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function runChecker(root) {
  return spawnSync(process.execPath, ["scripts/architecture-check.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
}

test("allows a repository with no Telegram product source owner", async () => {
  await withFixture({}, async (root) => {
    const result = runChecker(root);
    assert.equal(result.status, 0, `stdout=${result.stdout} stderr=${result.stderr}`);
  });
});

test("rejects a new Telegram product source owner", async () => {
  await withFixture(
    {
      "apps/telegram/src/index.ts": "export {};\n",
    },
    async (root) => {
      const result = runChecker(root);
      assert.notEqual(
        result.status,
        0,
        `expected failure, got stdout=${result.stdout} stderr=${result.stderr}`,
      );
      assert.match(
        result.stderr,
        /apps\/telegram\/src\/index\.ts: Telegram product source must live in the canonical Web frontend/,
      );
    },
  );
});
