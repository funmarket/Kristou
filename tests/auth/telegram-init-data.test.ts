import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { validateTelegramInitData } from "../../packages/auth/src/telegram-init-data.ts";

const botToken = "123456:synthetic_test_only";
const now = 1_800_000_000;
function signed(fields: [string, string][]): string {
  const check = [...fields]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  return new URLSearchParams([...fields, ["hash", hash]]).toString();
}
const fields: [string, string][] = [
  ["auth_date", String(now - 100)],
  ["query_id", "AAEFakeQuery"],
  ["user", '{"id":42,"first_name":"A B"}'],
];

test("accept signed original initData with special characters", () => {
  assert.equal(validateTelegramInitData(signed(fields), botToken, { nowSeconds: now }), true);
});

test("reject modified signed payload or wrong bot token", () => {
  const original = signed(fields);
  assert.equal(
    validateTelegramInitData(original.replace("AAEFakeQuery", "AAEFakeQueryX"), botToken, {
      nowSeconds: now,
    }),
    false,
  );
  assert.equal(validateTelegramInitData(original, "wrong:token", { nowSeconds: now }), false);
});

test("reject missing/duplicate hash, duplicate auth_date, malformed timestamps", () => {
  const original = signed(fields);
  assert.equal(
    validateTelegramInitData(new URLSearchParams(fields).toString(), botToken, { nowSeconds: now }),
    false,
  );
  assert.equal(
    validateTelegramInitData(original + "&hash=bad", botToken, { nowSeconds: now }),
    false,
  );
  assert.equal(
    validateTelegramInitData(original + "&auth_date=1", botToken, { nowSeconds: now }),
    false,
  );
  assert.equal(
    validateTelegramInitData(signed([["auth_date", "NaN"]]), botToken, { nowSeconds: now }),
    false,
  );
});

test("reject expiry and excessive future clock skew", () => {
  assert.equal(
    validateTelegramInitData(signed([["auth_date", String(now - 86_401)]]), botToken, {
      nowSeconds: now,
    }),
    false,
  );
  assert.equal(
    validateTelegramInitData(signed([["auth_date", String(now + 61)]]), botToken, {
      nowSeconds: now,
    }),
    false,
  );
  assert.equal(
    validateTelegramInitData(signed([["auth_date", String(now + 60)]]), botToken, {
      nowSeconds: now,
    }),
    true,
  );
});

test("reject malformed options and oversized payload", () => {
  assert.equal(
    validateTelegramInitData(signed(fields), botToken, { nowSeconds: now, maxAgeSeconds: -1 }),
    false,
  );
  assert.equal(validateTelegramInitData("x".repeat(20_000), botToken, { nowSeconds: now }), false);
});
