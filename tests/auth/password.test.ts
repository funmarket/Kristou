import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../../packages/auth/src/index.js";

test("passwords use Argon2id and verify without exposing plaintext", async () => {
  const password = "correct-horse";
  const hash = await hashPassword(password);

  assert.match(hash, /^\$argon2id\$/);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(hash, password), true);
  assert.equal(await verifyPassword(hash, "wrong-password"), false);
});
