import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiApp } from "../../apps/api/src/bootstrap/app.js";
import {
  correctPassword,
  MemoryIdentityRepository,
  sessionCookieFrom,
  startTestServer,
  testConfig,
} from "../auth/r7-fixtures.js";

function appWith(repository: MemoryIdentityRepository) {
  return createApiApp(
    {
      config: testConfig,
      readiness: { isReady: () => true },
      identityRepository: repository,
    } as unknown as Parameters<typeof createApiApp>[0],
  );
}

test(
  "valid Web credentials issue an opaque server session that resolves to the canonical User",
  async () => {
    const repository = new MemoryIdentityRepository();
    repository.addCredential("parent.ahmed", "user-web-1");
    const server = await startTestServer(appWith(repository));

    try {
      const login = await fetch(`${server.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          loginUsername: " Parent.Ahmed ",
          password: correctPassword,
        }),
      });

      assert.equal(login.status, 200);
      assert.deepEqual(await login.json(), { principal: { userId: "user-web-1" } });

      const setCookie = login.headers.get("set-cookie");
      assert.ok(setCookie);
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=Lax/i);
      assert.match(setCookie, /Path=\//i);

      const cookie = sessionCookieFrom(login);
      const rawToken = cookie.slice(cookie.indexOf("=") + 1);
      assert.ok(rawToken.length >= 32);
      assert.equal(repository.sessions.size, 1);
      const stored = [...repository.sessions.values()][0];
      assert.notEqual(stored.tokenHash, rawToken);

      const me = await fetch(`${server.baseUrl}/auth/me`, {
        headers: { cookie },
      });
      assert.equal(me.status, 200);
      assert.deepEqual(await me.json(), { principal: { userId: "user-web-1" } });
    } finally {
      await server.close();
    }
  },
);

test("invalid credentials, expired sessions, and revoked sessions fail closed", async () => {
  const repository = new MemoryIdentityRepository();
  repository.addCredential("parent.ahmed", "user-web-2");
  const server = await startTestServer(appWith(repository));

  try {
    const invalid = await fetch(`${server.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginUsername: "parent.ahmed",
        password: "wrong-password",
      }),
    });
    assert.equal(invalid.status, 401);
    assert.deepEqual(await invalid.json(), { error: "AUTH_INVALID" });

    const login = await fetch(`${server.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginUsername: "parent.ahmed",
        password: correctPassword,
      }),
    });
    assert.equal(login.status, 200);
    const cookie = sessionCookieFrom(login);

    repository.expireSessions();
    const expired = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { cookie },
    });
    assert.equal(expired.status, 401);
    assert.deepEqual(await expired.json(), { error: "AUTH_EXPIRED" });

    const secondLogin = await fetch(`${server.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginUsername: "parent.ahmed",
        password: correctPassword,
      }),
    });
    const secondCookie = sessionCookieFrom(secondLogin);
    repository.revokeSessions();
    const revoked = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { cookie: secondCookie },
    });
    assert.equal(revoked.status, 401);
    assert.deepEqual(await revoked.json(), { error: "AUTH_INVALID" });
  } finally {
    await server.close();
  }
});

test("logout revokes the server session and clears the browser cookie", async () => {
  const repository = new MemoryIdentityRepository();
  repository.addCredential("parent.ahmed", "user-web-3");
  const server = await startTestServer(appWith(repository));

  try {
    const login = await fetch(`${server.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginUsername: "parent.ahmed",
        password: correctPassword,
      }),
    });
    const cookie = sessionCookieFrom(login);

    const logout = await fetch(`${server.baseUrl}/auth/logout`, {
      method: "POST",
      headers: { cookie },
    });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/i);
    assert.equal([...repository.sessions.values()].every((session) => session.revokedAt), true);

    const me = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { cookie },
    });
    assert.equal(me.status, 401);
  } finally {
    await server.close();
  }
});
