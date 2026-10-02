import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TelegramInitDataError,
  validateTelegramInitData,
} from "../../packages/auth/src/index.js";
import { signTelegramInitData, testConfig } from "./r7-fixtures.js";

function signed(authDate: number) {
  return signTelegramInitData({
    botToken: testConfig.telegramBotToken,
    authDate,
    user: {
      id: 803449001,
      username: "parent_test",
      first_name: "Parent",
      language_code: "fr",
    },
  });
}

test("Telegram initData validates signature, identity, and freshness", () => {
  const now = new Date("2026-10-02T23:00:00.000Z");
  const raw = signed(Math.floor(now.getTime() / 1000));

  const result = validateTelegramInitData(raw, testConfig.telegramBotToken, {
    maxAgeSeconds: 300,
    now,
  });

  assert.equal(result.user.telegramUserId, 803449001n);
  assert.equal(result.user.telegramUsername, "parent_test");
});

test("Telegram initData rejects tampering, staleness, and missing user", () => {
  const now = new Date("2026-10-02T23:00:00.000Z");
  const authDate = Math.floor(now.getTime() / 1000);
  const tampered = new URLSearchParams(signed(authDate));
  tampered.set(
    "user",
    JSON.stringify({ id: 803449999, username: "tampered", first_name: "Tampered" }),
  );

  assert.throws(
    () =>
      validateTelegramInitData(tampered.toString(), testConfig.telegramBotToken, {
        maxAgeSeconds: 300,
        now,
      }),
    TelegramInitDataError,
  );

  assert.throws(
    () =>
      validateTelegramInitData(
        signed(authDate - 301),
        testConfig.telegramBotToken,
        { maxAgeSeconds: 300, now },
      ),
    TelegramInitDataError,
  );

  const missingUser = signTelegramInitData({
    botToken: testConfig.telegramBotToken,
    authDate,
  });
  assert.throws(
    () =>
      validateTelegramInitData(missingUser, testConfig.telegramBotToken, {
        maxAgeSeconds: 300,
        now,
      }),
    TelegramInitDataError,
  );
});
