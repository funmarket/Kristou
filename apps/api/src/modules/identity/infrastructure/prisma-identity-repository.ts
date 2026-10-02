import type { TelegramInitDataUser } from "@kristou/auth";
import type { PrismaClient } from "@kristou/database";
import type {
  IdentityRepository,
  StoredWebCredential,
  StoredWebSession,
} from "../application/auth-service.js";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function telegramData(profile: TelegramInitDataUser, authenticatedAt: Date) {
  return {
    telegramUserId: profile.telegramUserId,
    telegramUsername: profile.telegramUsername ?? null,
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    languageCode: profile.languageCode ?? null,
    lastAuthenticatedAt: authenticatedAt,
  };
}

export class PrismaIdentityRepository implements IdentityRepository {
  constructor(private readonly db: PrismaClient) {}

  async findWebCredential(loginUsername: string): Promise<StoredWebCredential | null> {
    return this.db.webCredential.findUnique({
      where: { loginUsername },
      select: {
        userId: true,
        loginUsername: true,
        passwordHash: true,
        lockedUntil: true,
      },
    });
  }

  async createWebSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.webSession.create({ data: input });
  }

  async findWebSession(tokenHash: string): Promise<StoredWebSession | null> {
    return this.db.webSession.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  }

  async revokeWebSession(tokenHash: string, revokedAt: Date): Promise<void> {
    await this.db.webSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });
  }

  async findTelegramIdentity(telegramUserId: bigint): Promise<{ userId: string } | null> {
    return this.db.telegramIdentity.findUnique({
      where: { telegramUserId },
      select: { userId: true },
    });
  }

  async touchTelegramIdentity(
    telegramUserId: bigint,
    profile: TelegramInitDataUser,
    authenticatedAt: Date,
  ): Promise<void> {
    await this.db.telegramIdentity.update({
      where: { telegramUserId },
      data: telegramData(profile, authenticatedAt),
    });
  }

  async createTelegramUser(profile: TelegramInitDataUser, authenticatedAt: Date): Promise<string> {
    try {
      return await this.db.$transaction(async (tx) => {
        const existing = await tx.telegramIdentity.findUnique({
          where: { telegramUserId: profile.telegramUserId },
          select: { userId: true },
        });
        if (existing) {
          await tx.telegramIdentity.update({
            where: { telegramUserId: profile.telegramUserId },
            data: telegramData(profile, authenticatedAt),
          });
          return existing.userId;
        }

        const user = await tx.user.create({
          data: {
            telegramIdentity: {
              create: telegramData(profile, authenticatedAt),
            },
          },
          select: { id: true },
        });
        return user.id;
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const existing = await this.db.telegramIdentity.findUnique({
        where: { telegramUserId: profile.telegramUserId },
        select: { userId: true },
      });
      if (!existing) throw error;
      await this.touchTelegramIdentity(profile.telegramUserId, profile, authenticatedAt);
      return existing.userId;
    }
  }
}
