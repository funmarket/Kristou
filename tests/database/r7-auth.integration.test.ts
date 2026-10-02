import assert from "node:assert/strict";
import { test } from "node:test";
import { getDatabaseClient } from "../../packages/database/src/index.ts";
import { PrismaIdentityRepository } from "../../apps/api/src/modules/identity/infrastructure/prisma-identity-repository.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for R7 auth integration tests");
}

const db = getDatabaseClient();

test("concurrent Telegram provisioning creates exactly one canonical User", async () => {
  const telegramUserId = 990000000001n;
  const existing = await db.telegramIdentity.findUnique({
    where: { telegramUserId },
    select: { userId: true },
  });
  if (existing) {
    await db.user.delete({ where: { id: existing.userId } });
  }

  const beforeUsers = await db.user.count();
  const repository = new PrismaIdentityRepository(db);
  const profile = {
    telegramUserId,
    telegramUsername: "r7_concurrency",
    firstName: "R7",
    languageCode: "en",
  };
  const authenticatedAt = new Date("2026-10-02T23:00:00.000Z");

  const [first, second] = await Promise.all([
    repository.createTelegramUser(profile, authenticatedAt),
    repository.createTelegramUser(profile, authenticatedAt),
  ]);

  assert.equal(first, second);
  assert.equal(
    await db.telegramIdentity.count({ where: { telegramUserId } }),
    1,
  );
  assert.equal(await db.user.count(), beforeUsers + 1);

  await db.user.delete({ where: { id: first } });
});
