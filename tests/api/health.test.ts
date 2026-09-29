import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { createApiApp } from "../../apps/api/src/bootstrap/app.js";
import { startApiServer } from "../../apps/api/src/bootstrap/server.js";

const config = {
  appEnv: "local" as const,
  databaseUrl: "postgresql://kristou:kristou@localhost:5432/kristou",
  redisUrl: "redis://localhost:6379",
  webOrigin: "http://localhost:5173",
  sessionCookieName: "kristou_session",
  sessionTokenPepper: "0123456789abcdef0123456789abcdef",
};

test("health liveness is 200 while readiness reflects dependency state", async () => {
  let ready = false;
  const app = createApiApp({ config, readiness: { isReady: () => ready } });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;

    const live = await fetch(`${base}/health/live`);
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: "ok" });

    const notReady = await fetch(`${base}/health/ready`);
    assert.equal(notReady.status, 503);
    assert.deepEqual(await notReady.json(), { status: "not_ready" });

    ready = true;
    const readyResponse = await fetch(`${base}/health/ready`);
    assert.equal(readyResponse.status, 200);
    assert.deepEqual(await readyResponse.json(), { status: "ready" });
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("invalid production config stops API startup before listening", () => {
  assert.throws(
    () =>
      startApiServer(
        {
          APP_ENV: "production",
          DATABASE_URL: "postgresql://db.example.test/kristou",
          REDIS_URL: "redis://redis.example.test:6379",
          WEB_ORIGIN: "https://school.example.test",
          SESSION_COOKIE_NAME: "kristou_session",
        },
        { port: 0, host: "127.0.0.1" },
      ),
    { name: "ZodError" },
  );
});
