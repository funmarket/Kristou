import assert from "node:assert/strict";
import test from "node:test";
import { KristouShell } from "../../packages/frontend/src/shell/KristouShell.tsx";

test("KristouShell source loads in Node tests without raw stylesheet execution", () => {
  assert.equal(typeof KristouShell, "function");
});
