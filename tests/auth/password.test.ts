import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../../packages/auth/src/password.ts";

test("Argon2id hash validates correct password and rejects wrong password", async () => {
  const hash = await hashPassword("correct-password-1!");
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, "correct-password-1!"), true);
  assert.equal(await verifyPassword(hash, "wrong-password"), false);
});

test("two password hashes use independent salts", async () => {
  const first = await hashPassword("same-password-1!");
  const second = await hashPassword("same-password-1!");
  assert.notEqual(first, second);
});

test("invalid hash fails closed and empty password is refused", async () => {
  assert.equal(await verifyPassword("garbage", "password"), false);
  assert.equal(await verifyPassword("$argon2id$garbage", "password"), false);
  await assert.rejects(hashPassword(""), TypeError);
});
