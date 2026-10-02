import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadApiConfig,
  loadWebPublicConfig,
  loadWorkerConfig,
} from "../../packages/config/src/index.js";

const localServerEnv = {
  APP_ENV: "local",
  DATABASE_URL: "postgresql://kristou:kristou@localhost:5432/kristou",
  REDIS_URL: "redis://localhost:6379",
  WEB_ORIGIN: "http://localhost:5173",
  SESSION_COOKIE_NAME: "kristou_session",
  SESSION_TOKEN_PEPPER: "0123456789abcdef0123456789abcdef",
  SESSION_TTL_SECONDS: "3600",
  TELEGRAM_BOT_TOKEN: "test-telegram-bot-token",
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: "300",
};

const productionServerEnv = {
  ...localServerEnv,
  APP_ENV: "production",
  WEB_ORIGIN: "https://school.example.test",
};

test("server loaders accept explicit local configuration", () => {
  const api = loadApiConfig(localServerEnv);
  assert.equal(api.appEnv, "local");
  assert.equal(api.sessionTtlSeconds, 3600);
  assert.equal(api.telegramInitDataMaxAgeSeconds, 300);
  assert.equal(loadWorkerConfig(localServerEnv).appEnv, "local");
});

test("production api config rejects missing durable and security values", () => {
  for (const key of [
    "DATABASE_URL",
    "REDIS_URL",
    "WEB_ORIGIN",
    "SESSION_TOKEN_PEPPER",
    "SESSION_TTL_SECONDS",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_INIT_DATA_MAX_AGE_SECONDS",
  ]) {
    const env = { ...productionServerEnv };
    delete env[key as keyof typeof env];
    assert.throws(() => loadApiConfig(env), { name: "ZodError" });
  }
});

test("production worker config rejects missing durable runtime values", () => {
  for (const key of ["DATABASE_URL", "REDIS_URL"]) {
    const env = { ...productionServerEnv };
    delete env[key as keyof typeof env];
    assert.throws(() => loadWorkerConfig(env), { name: "ZodError" });
  }
});

test("APP_ENV is explicit and is not inferred from NODE_ENV", () => {
  const env = { ...productionServerEnv, APP_ENV: undefined, NODE_ENV: "production" };
  assert.throws(() => loadApiConfig(env), { name: "ZodError" });
});

test("public web config returns only explicitly public values", () => {
  const config = loadWebPublicConfig({
    VITE_APP_ENV: "local",
    VITE_API_BASE_URL: "http://localhost:3000",
    TELEGRAM_BOT_TOKEN: "secret",
    DATABASE_URL: localServerEnv.DATABASE_URL,
    SESSION_TOKEN_PEPPER: localServerEnv.SESSION_TOKEN_PEPPER,
    OBJECT_STORAGE_SECRET_ACCESS_KEY: "secret-storage-key",
  });

  assert.deepEqual(config, {
    appEnv: "local",
    apiBaseUrl: "http://localhost:3000",
  });
  assert.equal("TELEGRAM_BOT_TOKEN" in config, false);
  assert.equal("DATABASE_URL" in config, false);
  assert.equal("SESSION_TOKEN_PEPPER" in config, false);
  assert.equal("OBJECT_STORAGE_SECRET_ACCESS_KEY" in config, false);
});

test("invalid URLs are rejected", () => {
  assert.throws(() => loadApiConfig({ ...localServerEnv, WEB_ORIGIN: "not-a-url" }), {
    name: "ZodError",
  });
  assert.throws(
    () => loadWebPublicConfig({ VITE_APP_ENV: "local", VITE_API_BASE_URL: "not-a-url" }),
    { name: "ZodError" },
  );
});
