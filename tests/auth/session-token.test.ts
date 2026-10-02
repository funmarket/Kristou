import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSessionToken, hashSessionToken } from "../../packages/auth/src/index.js";

test("session tokens are opaque and only their keyed hash is persisted", () => {
  const first = generateSessionToken();
  const second = generateSessionToken();
  const pepper = "0123456789abcdef0123456789abcdef";
  const firstHash = hashSessionToken(first, pepper);

  assert.notEqual(first, second);
  assert.ok(first.length >= 32);
  assert.notEqual(firstHash, first);
  assert.equal(firstHash, hashSessionToken(first, pepper));
});
