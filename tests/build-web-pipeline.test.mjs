import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("build:web builds config, ui, frontend, then web in dependency order", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(
    manifest.scripts?.["build:web"],
    "npm -w @kristou/config run build && npm -w @kristou/ui run build && npm -w @kristou/frontend run build && npm -w @kristou/web run build",
  );
});
