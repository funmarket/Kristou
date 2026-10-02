import {
  generateSessionToken,
  hashSessionToken,
  validateTelegramInitData,
  verifyPassword,
  type TelegramInitDataUser,
} from "@kristou/auth";

export interface AuthenticatedPrincipal {
  userId: string;
}

export interface StoredWebCredential {
  userId: string;
  loginUsername: string;
  passwordHash: string;
  lockedUntil: Date | null;
}

export interface StoredWebSession {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface IdentityRepository {
  findWebCredential(loginUsername: string): Promise<StoredWebCredential | null>;
  createWebSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findWebSession(tokenHash: string): Promise<StoredWebSession | null>;
  revokeWebSession(tokenHash: string, revokedAt: Date): Promise<void>;
  findTelegramIdentity(telegramUserId: bigint): Promise<{ userId: string } | null>;
  touchTelegramIdentity(
    telegramUserId: bigint,
    profile: TelegramInitDataUser,
    authenticatedAt: Date,
  ): Promise<void>;
  createTelegramUser(profile: TelegramInitDataUser, authenticatedAt: Date): Promise<string>;
}

export type AuthErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "AUTH_EXPIRED"
  | "AUTH_CONFLICT";

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
  }
}

export interface IdentityAuthServiceOptions {
  sessionTokenPepper: string;
  sessionTtlSeconds: number;
  telegramBotToken: string;
  telegramInitDataMaxAgeSeconds: number;
  now?: () => Date;
}

export interface WebLoginResult {
  principal: AuthenticatedPrincipal;
  sessionToken: string;
}

export class IdentityAuthService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly options: IdentityAuthServiceOptions,
  ) {}

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }

  private sessionHash(token: string): string {
    return hashSessionToken(token, this.options.sessionTokenPepper);
  }

  async loginWeb(loginUsername: string, password: string): Promise<WebLoginResult> {
    const normalized = loginUsername.trim().toLowerCase();
    if (!normalized || !password) throw new AuthError("AUTH_INVALID");

    const credential = await this.repository.findWebCredential(normalized);
    const now = this.now();
    if (
      !credential ||
      (credential.lockedUntil !== null && credential.lockedUntil.getTime() > now.getTime()) ||
      !(await verifyPassword(credential.passwordHash, password))
    ) {
      throw new AuthError("AUTH_INVALID");
    }

    const sessionToken = generateSessionToken();
    await this.repository.createWebSession({
      userId: credential.userId,
      tokenHash: this.sessionHash(sessionToken),
      expiresAt: new Date(now.getTime() + this.options.sessionTtlSeconds * 1000),
    });

    return {
      principal: { userId: credential.userId },
      sessionToken,
    };
  }

  async authenticateWebSession(token: string): Promise<AuthenticatedPrincipal> {
    if (!token) throw new AuthError("AUTH_INVALID");
    const session = await this.repository.findWebSession(this.sessionHash(token));
    if (!session || session.revokedAt !== null) throw new AuthError("AUTH_INVALID");
    if (session.expiresAt.getTime() <= this.now().getTime()) {
      throw new AuthError("AUTH_EXPIRED");
    }
    return { userId: session.userId };
  }

  async logoutWeb(token: string): Promise<void> {
    if (!token) return;
    await this.repository.revokeWebSession(this.sessionHash(token), this.now());
  }

  private validateTelegram(raw: string) {
    try {
      return validateTelegramInitData(raw, this.options.telegramBotToken, {
        maxAgeSeconds: this.options.telegramInitDataMaxAgeSeconds,
        now: this.now(),
      });
    } catch {
      throw new AuthError("AUTH_INVALID");
    }
  }

  async resolvePrincipal(input: {
    sessionToken?: string;
    telegramInitData?: string;
  }): Promise<AuthenticatedPrincipal> {
    if (!input.sessionToken && !input.telegramInitData) {
      throw new AuthError("AUTH_REQUIRED");
    }

    const webPrincipal = input.sessionToken
      ? await this.authenticateWebSession(input.sessionToken)
      : undefined;

    if (!input.telegramInitData) {
      if (!webPrincipal) throw new AuthError("AUTH_REQUIRED");
      return webPrincipal;
    }

    const telegram = this.validateTelegram(input.telegramInitData);
    const existing = await this.repository.findTelegramIdentity(
      telegram.user.telegramUserId,
    );

    if (webPrincipal) {
      if (!existing || existing.userId !== webPrincipal.userId) {
        throw new AuthError("AUTH_CONFLICT");
      }
      await this.repository.touchTelegramIdentity(
        telegram.user.telegramUserId,
        telegram.user,
        telegram.authDate,
      );
      return webPrincipal;
    }

    if (existing) {
      await this.repository.touchTelegramIdentity(
        telegram.user.telegramUserId,
        telegram.user,
        telegram.authDate,
      );
      return { userId: existing.userId };
    }

    const userId = await this.repository.createTelegramUser(
      telegram.user,
      telegram.authDate,
    );
    return { userId };
  }
}
