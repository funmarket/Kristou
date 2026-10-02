import { createHmac } from "node:crypto";
import { once } from "node:events";
import type { Server } from "node:http";
import type { Express } from "express";

export const testConfig = {
  appEnv: "local" as const,
  databaseUrl: "postgresql://kristou:kristou@localhost:5432/kristou",
  redisUrl: "redis://localhost:6379",
  webOrigin: "http://localhost:5173",
  sessionCookieName: "kristou_session",
  sessionTokenPepper: "0123456789abcdef0123456789abcdef",
  sessionTtlSeconds: 3600,
  telegramBotToken: "r7-test-telegram-bot-token",
  telegramInitDataMaxAgeSeconds: 300,
};

export const correctPassword = "correct-horse";
export const correctPasswordHash =
  "$argon2id$v=19$m=65536,t=3,p=4$MDEyMzQ1Njc4OWFiY2RlZg$fRjgLLxeWLMQ4vxNHljSOg98zH3bI9aHlA+Wnmtg+YY";

export interface TelegramProfile {
  telegramUserId: bigint;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export class MemoryIdentityRepository {
  readonly credentials = new Map<
    string,
    { userId: string; loginUsername: string; passwordHash: string; lockedUntil: Date | null }
  >();
  readonly sessions = new Map<
    string,
    { userId: string; tokenHash: string; expiresAt: Date; revokedAt: Date | null }
  >();
  readonly telegramIdentities = new Map<bigint, string>();
  readonly users = new Set<string>();
  createdTelegramUsers = 0;

  addCredential(loginUsername: string, userId: string): void {
    this.users.add(userId);
    this.credentials.set(loginUsername, {
      userId,
      loginUsername,
      passwordHash: correctPasswordHash,
      lockedUntil: null,
    });
  }

  addTelegramIdentity(telegramUserId: bigint, userId: string): void {
    this.users.add(userId);
    this.telegramIdentities.set(telegramUserId, userId);
  }

  async findWebCredential(loginUsername: string) {
    return this.credentials.get(loginUsername) ?? null;
  }

  async createWebSession(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    this.sessions.set(input.tokenHash, {
      ...input,
      revokedAt: null,
    });
  }

  async findWebSession(tokenHash: string) {
    return this.sessions.get(tokenHash) ?? null;
  }

  async revokeWebSession(tokenHash: string, revokedAt: Date) {
    const session = this.sessions.get(tokenHash);
    if (session) session.revokedAt = revokedAt;
  }

  async findTelegramIdentity(telegramUserId: bigint) {
    const userId = this.telegramIdentities.get(telegramUserId);
    return userId ? { userId } : null;
  }

  async touchTelegramIdentity(
    telegramUserId: bigint,
    _profile: TelegramProfile,
    _authenticatedAt: Date,
  ) {
    if (!this.telegramIdentities.has(telegramUserId)) {
      throw new Error("Telegram identity does not exist");
    }
  }

  async createTelegramUser(profile: TelegramProfile, _authenticatedAt: Date) {
    const existing = this.telegramIdentities.get(profile.telegramUserId);
    if (existing) return existing;

    const userId = `telegram-${profile.telegramUserId.toString()}`;
    this.users.add(userId);
    this.telegramIdentities.set(profile.telegramUserId, userId);
    this.createdTelegramUsers += 1;
    return userId;
  }

  expireSessions(): void {
    for (const session of this.sessions.values()) {
      session.expiresAt = new Date(0);
    }
  }

  revokeSessions(): void {
    for (const session of this.sessions.values()) {
      session.revokedAt = new Date();
    }
  }
}

export function signTelegramInitData(input: {
  botToken: string;
  authDate: number;
  user?: Record<string, unknown>;
  queryId?: string;
}): string {
  const params = new URLSearchParams();
  params.set("auth_date", String(input.authDate));
  if (input.queryId) params.set("query_id", input.queryId);
  if (input.user) params.set("user", JSON.stringify(input.user));

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(input.botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

export async function startTestServer(app: Express): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server: Server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not expose an address");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
}

export function sessionCookieFrom(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) throw new Error("Expected session cookie");
  return setCookie.split(";", 1)[0];
}
