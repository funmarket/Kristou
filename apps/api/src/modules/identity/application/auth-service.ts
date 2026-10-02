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

export type TelegramIdentityProfile = TelegramInitDataUser;

export interface IdentityRepository {
  findWebCredential(loginUsername: string): Promise<StoredWebCredential | null>;
  createWebSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findWebSession(tokenHash: string): Promise<StoredWebSession | null>;
  revokeWebSession(tokenHash: string, revokedAt: Date): Promise<void>;
  resolveTelegramUser(profile: TelegramIdentityProfile, authenticatedAt: Date): Promise<string>;
}

export interface IdentityAuthServiceOptions {
  sessionTokenPepper: string;
  sessionTtlSeconds: number;
  telegramBotToken: string;
  telegramInitDataMaxAgeSeconds: number;
  now?: () => Date;
}

export type AuthErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "AUTH_EXPIRED"
  | "AUTH_CONFLICT";

export class AuthError extends Error {
  override name = "AuthError";

  constructor(public readonly code: AuthErrorCode, message: string) {
    super(message);
  }
}

function normalizedLoginUsername(value: string): string {
  return value.trim().toLowerCase();
}

export class IdentityAuthService {
  private readonly now: () => Date;

  constructor(
    private readonly repository: IdentityRepository,
    private readonly options: IdentityAuthServiceOptions,
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async loginWeb(
    loginUsername: string,
    password: string,
  ): Promise<{ principal: AuthenticatedPrincipal; sessionToken: string }> {
    const credential = await this.repository.findWebCredential(
      normalizedLoginUsername(loginUsername),
    );
    const now = this.now();

    if (
      !credential ||
      (credential.lockedUntil !== null && credential.lockedUntil > now) ||
      !(await verifyPassword(credential.passwordHash, password))
    ) {
      throw new AuthError("AUTH_INVALID", "Authentication failed");
    }

    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken, this.options.sessionTokenPepper);
    const expiresAt = new Date(now.getTime() + this.options.sessionTtlSeconds * 1000);

    await this.repository.createWebSession({
      userId: credential.userId,
      tokenHash,
      expiresAt,
    });

    return {
      principal: { userId: credential.userId },
      sessionToken,
    };
  }

  async authenticateWebSession(sessionToken: string): Promise<AuthenticatedPrincipal> {
    if (!sessionToken) {
      throw new AuthError("AUTH_REQUIRED", "Authentication is required");
    }

    const tokenHash = hashSessionToken(
      sessionToken,
      this.options.sessionTokenPepper,
    );
    const session = await this.repository.findWebSession(tokenHash);

    if (!session || session.revokedAt !== null) {
      throw new AuthError("AUTH_INVALID", "Authentication failed");
    }
    if (session.expiresAt <= this.now()) {
      throw new AuthError("AUTH_EXPIRED", "Authentication expired");
    }

    return { userId: session.userId };
  }

  async logoutWeb(sessionToken: string): Promise<void> {
    if (!sessionToken) return;
    const tokenHash = hashSessionToken(
      sessionToken,
      this.options.sessionTokenPepper,
    );
    await this.repository.revokeWebSession(tokenHash, this.now());
  }

  async authenticateTelegram(initData: string): Promise<AuthenticatedPrincipal> {
    const validated = validateTelegramInitData(
      initData,
      this.options.telegramBotToken,
      {
        now: this.now(),
        maxAgeSeconds: this.options.telegramInitDataMaxAgeSeconds,
      },
    );
    const userId = await this.repository.resolveTelegramUser(validated.user, validated.authDate);
    return { userId };
  }

  async resolvePrincipal(input: {
    sessionToken?: string;
    telegramInitData?: string;
  }): Promise<AuthenticatedPrincipal> {
    const webPrincipal = input.sessionToken
      ? await this.authenticateWebSession(input.sessionToken)
      : undefined;
    const telegramPrincipal = input.telegramInitData
      ? await this.authenticateTelegram(input.telegramInitData)
      : undefined;

    if (
      webPrincipal &&
      telegramPrincipal &&
      webPrincipal.userId !== telegramPrincipal.userId
    ) {
      throw new AuthError(
        "AUTH_CONFLICT",
        "Authentication transports resolve to different users",
      );
    }

    const principal = webPrincipal ?? telegramPrincipal;
    if (!principal) {
      throw new AuthError("AUTH_REQUIRED", "Authentication is required");
    }
    return principal;
  }
}
