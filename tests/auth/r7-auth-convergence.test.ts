import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword } from "../../packages/auth/src/index.ts";
import { IdentityAuthService } from "../../apps/api/src/modules/identity/application/auth-service.ts";

test("R7 auth convergence owners exist", () => {
  assert.equal(typeof hashPassword, "function");
  assert.equal(typeof IdentityAuthService, "function");
});
