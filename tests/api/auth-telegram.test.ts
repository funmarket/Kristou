import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiApp } from "../../apps/api/src/bootstrap/app.js";
import {
  correctPassword,
  MemoryIdentityRepository,
  sessionCookieFrom,
  signTelegramInitData,
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

function currentAuthDate(): number {
  return Math.floor(Date.now() / 1000);
}

function signedFor(telegramUserId: number, authDate = currentAuthDate()): string {
  return signTelegramInitData({
    botToken: testConfig.telegramBotToken,
    authDate,
    queryId: "r7-query",
    user: {
      id: telegramUserId,
      username: `user_${telegramUserId}`,
      first_name: "KRISTOU",
      language_code: "fr",
    },
  });
}

test("valid signed Telegram initData resolves an existing canonical User", async () => {
  const repository = new MemoryIdentityRepository();
  repository.addTelegramIdentity(803441921n, "user-telegram-1");
  const server = await startTestServer(appWith(repository));

  try {
    const response = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { "x-telegram-init-data": signedFor(803441921) },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      principal: { userId: "user-telegram-1" },
    });
  } finally {
    await server.close();
  }
});

test("invalid, tampered, stale, and user-less Telegram initData are rejected", async () => {
  const repository = new MemoryIdentityRepository();
  const server = await startTestServer(appWith(repository));

  try {
    const valid = signedFor(803441922);

    const invalidHash = new URLSearchParams(valid);
    invalidHash.set("hash", "0".repeat(64));
    const invalid = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { "x-telegram-init-data": invalidHash.toString() },
    });
    assert.equal(invalid.status, 401);

    const tampered = new URLSearchParams(valid);
    tampered.set(
      "user",
      JSON.stringify({ id: 803441999, username: "tampered", first_name: "Tampered" }),
    );
    const tamperedResponse = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { "x-telegram-init-data": tampered.toString() },
    });
    assert.equal(tamperedResponse.status, 401);

    const stale = await fetch(`${server.baseUrl}/auth/me`, {
      headers: {
        "x-telegram-init-data": signedFor(
          803441923,
          currentAuthDate() - testConfig.telegramInitDataMaxAgeSeconds - 1,
        ),
      },
    });
    assert.equal(stale.status, 401);

    const missingUser = signTelegramInitData({
      botToken: testConfig.telegramBotToken,
      authDate: currentAuthDate(),
      queryId: "missing-user",
    });
    const missingUserResponse = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { "x-telegram-init-data": missingUser },
    });
    assert.equal(missingUserResponse.status, 401);
  } finally {
    await server.close();
  }
});

test("Telegram-only authentication can provision one canonical User", async () => {
  const repository = new MemoryIdentityRepository();
  const server = await startTestServer(appWith(repository));

  try {
    const response = await fetch(`${server.baseUrl}/auth/me`, {
      headers: { "x-telegram-init-data": signedFor(803441924) },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      principal: { userId: "telegram-803441924" },
    });
    assert.equal(repository.createdTelegramUsers, 1);
    assert.equal(repository.users.size, 1);
  } finally {
    await server.close();
  }
});

test("combined Web and Telegram credentials converge only when they resolve to the same User", async () => {
  const repository = new MemoryIdentityRepository();
  repository.addCredential("linked.parent", "user-linked");
  repository.addTelegramIdentity(803441925n, "user-linked");
  repository.addTelegramIdentity(803441926n, "user-other");
  const server = await startTestServer(appWith(repository));

  try {
    const login = await fetch(`${server.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginUsername: "linked.parent",
        password: correctPassword,
      }),
    });
    assert.equal(login.status, 200);
    const cookie = sessionCookieFrom(login);

    const same = await fetch(`${server.baseUrl}/auth/me`, {
      headers: {
        cookie,
        "x-telegram-init-data": signedFor(803441925),
      },
    });
    assert.equal(same.status, 200);
    assert.deepEqual(await same.json(), { principal: { userId: "user-linked" } });

    const conflict = await fetch(`${server.baseUrl}/auth/me`, {
      headers: {
        cookie,
        "x-telegram-init-data": signedFor(803441926),
      },
    });
    assert.equal(conflict.status, 409);
    assert.deepEqual(await conflict.json(), { error: "AUTH_CONFLICT" });
  } finally {
    await server.close();
  }
});

test("a Web-authenticated request never provisions an unknown Telegram identity before conflict resolution", async () => {
  const repository = new MemoryIdentityRepository();
  repository.addCredential("linked.parent", "user-linked");
  const server = await startTestServer(appWith(repository));

  try {
    const login = await fetch(`${server.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        loginUsername: "linked.parent",
        password: correctPassword,
      }),
    });
    const cookie = sessionCookieFrom(login);

    const conflict = await fetch(`${server.baseUrl}/auth/me`, {
      headers: {
        cookie,
        "x-telegram-init-data": signedFor(803441927),
      },
    });
    assert.equal(conflict.status, 409);
    assert.deepEqual(await conflict.json(), { error: "AUTH_CONFLICT" });
    assert.equal(repository.createdTelegramUsers, 0);
    assert.equal(repository.telegramIdentities.has(803441927n), false);
  } finally {
    await server.close();
  }
});
