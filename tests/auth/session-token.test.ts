import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateSessionToken,
  hashSessionToken,
  verifySessionTokenHash,
} from "../../packages/auth/src/session-token.ts";

test("opaque session tokens contain 256 random bits", () => {
  const first = generateSessionToken();
  const second = generateSessionToken();
  assert.equal(Buffer.from(first, "base64url").length, 32);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
});

test("store a SHA-256 digest, never a raw token", () => {
  const token = generateSessionToken();
  const digest = hashSessionToken(token);
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal(hashSessionToken(token), digest);
  assert.notEqual(digest, token);
  assert.equal(verifySessionTokenHash(token, digest), true);
});

test("reject wrong token, malformed token, and digest", () => {
  const one = generateSessionToken();
  const two = generateSessionToken();
  assert.equal(verifySessionTokenHash(two, hashSessionToken(one)), false);
  assert.equal(verifySessionTokenHash(one, "garbage"), false);
  assert.equal(verifySessionTokenHash("not-a-token", hashSessionToken(one)), false);
  assert.throws(() => hashSessionToken("not-a-token"), TypeError);
});
