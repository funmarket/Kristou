import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  validateTelegramInitData,
  verifyPassword,
} from "../../packages/auth/src/index.ts";
import {
  AuthError,
  IdentityAuthService,
  type IdentityRepository,
  type StoredWebCredential,
  type StoredWebSession,
  type TelegramIdentityProfile,
} from "../../apps/api/src/modules/identity/application/auth-service.ts";

const BOT_TOKEN = "123456789:test-bot-token";
const SESSION_PEPPER = "0123456789abcdef0123456789abcdef";
const NOW = new Date("2026-10-02T21:30:00.000Z");

function signTelegramInitData(
  user: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  },
  authDate: number,
  botToken = BOT_TOKEN,
): string {
  const fields = new URLSearchParams({
    auth_date: String(authDate),
    query_id: "AAE-test-query",
    user: JSON.stringify(user),
  });
  const dataCheckString = [...fields.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  fields.set("hash", hash);
  return fields.toString();
}

class FakeIdentityRepository implements IdentityRepository {
  credential: StoredWebCredential | null = null;
  sessions = new Map<string, StoredWebSession>();
  telegramUsers = new Map<string, string>();
  createdTelegramUsers = 0;

  async findWebCredential(
    loginUsername: string,
  ): Promise<StoredWebCredential | null> {
    return this.credential?.loginUsername === loginUsername ? this.credential : null;
  }

  async createWebSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    this.sessions.set(input.tokenHash, {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    });
  }

  async findWebSession(tokenHash: string): Promise<StoredWebSession | null> {
    return this.sessions.get(tokenHash) ?? null;
  }

  async revokeWebSession(tokenHash: string, revokedAt: Date): Promise<void> {
    const session = this.sessions.get(tokenHash);
    if (session) this.sessions.set(tokenHash, { ...session, revokedAt });
  }

  async resolveTelegramUser(
    profile: TelegramIdentityProfile,
    _authenticatedAt: Date,
  ): Promise<string> {
    const key = profile.telegramUserId.toString();
    const existing = this.telegramUsers.get(key);
    if (existing) return existing;

    const userId = `telegram-user-${++this.createdTelegramUsers}`;
    this.telegramUsers.set(key, userId);
    return userId;
  }
}

test("password hashes use Argon2id and reject the wrong password", async () => {
  const hash = await hashPassword("correct horse battery staple");

  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, "correct horse battery staple"), true);
  assert.equal(await verifyPassword(hash, "wrong password"), false);
});

test(
  "session helpers expose an opaque token while persisting only its peppered hash",
  () => {
    const issued = generateSessionToken();
    const storedHash = hashSessionToken(issued, SESSION_PEPPER);

    assert.notEqual(storedHash, issued);
    assert.equal(storedHash, hashSessionToken(issued, SESSION_PEPPER));
    assert.match(storedHash, /^[a-f0-9]{64}$/);
  },
);

test(
  "Telegram initData validates the official HMAC contract and fails closed when tampered or stale",
  () => {
    const nowSeconds = Math.floor(NOW.getTime() / 1000);
    const raw = signTelegramInitData(
      {
        id: 803441921,
        username: "linked_parent",
        first_name: "Linked",
        last_name: "Parent",
        language_code: "fr",
      },
      nowSeconds,
    );

    const validated = validateTelegramInitData(raw, BOT_TOKEN, {
      now: NOW,
      maxAgeSeconds: 900,
    });

    assert.equal(validated.user.telegramUserId, BigInt("803441921"));
    assert.equal(validated.user.telegramUsername, "linked_parent");

    const tampered = raw.replace("linked_parent", "attacker");
    assert.throws(
      () =>
        validateTelegramInitData(tampered, BOT_TOKEN, {
          now: NOW,
          maxAgeSeconds: 900,
        }),
      { name: "TelegramInitDataError" },
    );

    const stale = signTelegramInitData({ id: 803441921 }, nowSeconds - 901);
    assert.throws(
      () =>
        validateTelegramInitData(stale, BOT_TOKEN, {
          now: NOW,
          maxAgeSeconds: 900,
        }),
      { name: "TelegramInitDataError" },
    );
  },
);

test(
  "Web credential login issues a hashed server session that resolves to the canonical User",
  async () => {
    const repository = new FakeIdentityRepository();
    repository.credential = {
      userId: "user-canonical-1",
      loginUsername: "parent.ahmed",
      passwordHash: await hashPassword("school-password"),
      lockedUntil: null,
    };

    const service = new IdentityAuthService(repository, {
      sessionTokenPepper: SESSION_PEPPER,
      sessionTtlSeconds: 3600,
      telegramBotToken: BOT_TOKEN,
      telegramInitDataMaxAgeSeconds: 900,
      now: () => NOW,
    });

    const login = await service.loginWeb(" PARENT.AHMED ", "school-password");

    assert.equal(login.principal.userId, "user-canonical-1");
    assert.equal(repository.sessions.size, 1);
    assert.equal(repository.sessions.has(login.sessionToken), false);

    const principal = await service.authenticateWebSession(login.sessionToken);
    assert.deepEqual(principal, { userId: "user-canonical-1" });
  },
);

test(
  "Telegram authentication resolves to the same canonical principal and provisions only when identity is new",
  async () => {
    const repository = new FakeIdentityRepository();
    repository.telegramUsers.set("803441921", "user-canonical-1");

    const service = new IdentityAuthService(repository, {
      sessionTokenPepper: SESSION_PEPPER,
      sessionTtlSeconds: 3600,
      telegramBotToken: BOT_TOKEN,
      telegramInitDataMaxAgeSeconds: 900,
      now: () => NOW,
    });
    const nowSeconds = Math.floor(NOW.getTime() / 1000);

    const existing = await service.authenticateTelegram(
      signTelegramInitData({ id: 803441921, username: "linked_parent" }, nowSeconds),
    );
    assert.deepEqual(existing, { userId: "user-canonical-1" });
    assert.equal(repository.createdTelegramUsers, 0);

    const created = await service.authenticateTelegram(
      signTelegramInitData({ id: 803441922, username: "new_parent" }, nowSeconds),
    );
    assert.deepEqual(created, { userId: "telegram-user-1" });
    assert.equal(repository.createdTelegramUsers, 1);
  },
);

test(
  "conflicting independently valid Web and Telegram transports fail closed",
  async () => {
    const repository = new FakeIdentityRepository();
    const rawSession = "session-token-for-conflict";
    repository.sessions.set(hashSessionToken(rawSession, SESSION_PEPPER), {
      userId: "web-user",
      tokenHash: hashSessionToken(rawSession, SESSION_PEPPER),
      expiresAt: new Date(NOW.getTime() + 60_000),
      revokedAt: null,
    });
    repository.telegramUsers.set("803441921", "telegram-user");

    const service = new IdentityAuthService(repository, {
      sessionTokenPepper: SESSION_PEPPER,
      sessionTtlSeconds: 3600,
      telegramBotToken: BOT_TOKEN,
      telegramInitDataMaxAgeSeconds: 900,
      now: () => NOW,
    });

    await assert.rejects(
      () =>
        service.resolvePrincipal({
          sessionToken: rawSession,
          telegramInitData: signTelegramInitData(
            { id: 803441921 },
            Math.floor(NOW.getTime() / 1000),
          ),
        }),
      (error: unknown) => error instanceof AuthError && error.code === "AUTH_CONFLICT",
    );
  },
);
