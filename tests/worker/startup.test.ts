import assert from "node:assert/strict";
import { test } from "node:test";
import { startWorker } from "../../apps/worker/src/main.js";

const localWorkerEnv = {
  APP_ENV: "local",
  DATABASE_URL: "postgresql://kristou:kristou@localhost:5432/kristou",
  REDIS_URL: "redis://localhost:6379",
};

test("worker becomes ready after initialization and not ready after stop", async () => {
  const worker = startWorker(localWorkerEnv, { installSignalHandlers: false });
  assert.equal(worker.health.isReady(), true);
  await worker.stop();
  assert.equal(worker.health.isReady(), false);
});

test("invalid production config stops worker startup", () => {
  assert.throws(
    () => startWorker({ APP_ENV: "production", DATABASE_URL: localWorkerEnv.DATABASE_URL }),
    { name: "ZodError" },
  );
});
