import assert from "node:assert/strict";
import test from "node:test";
import { getDatabaseClient } from "../../packages/database/src/index.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for KRISTOU foundation integration tests");
}

const db = getDatabaseClient();

async function resetFoundation() {
  await db.accountLinkChallenge.deleteMany();
  await db.webSession.deleteMany();
  await db.webCredential.deleteMany();
  await db.telegramIdentity.deleteMany();
  await db.auditLog.deleteMany();
  await db.outboxEvent.deleteMany();
  await db.user.deleteMany();
}

test("Web credentials use one unique normalized login username while email remains optional", async () => {
  await resetFoundation();
  const first = await db.user.create({ data: {} });
  const second = await db.user.create({ data: {} });

  await db.webCredential.create({
    data: {
      userId: first.id,
      loginUsername: "parent.ahmed",
      passwordHash: "argon2id-test-hash",
      email: null,
    },
  });

  await assert.rejects(() =>
    db.webCredential.create({
      data: {
        userId: second.id,
        loginUsername: "parent.ahmed",
        passwordHash: "argon2id-test-hash-2",
        email: "optional@example.com",
      },
    }),
  );
});

test("one canonical User can own both Web and Telegram identities without creating a second User", async () => {
  await resetFoundation();
  const user = await db.user.create({ data: {} });

  await db.webCredential.create({
    data: {
      userId: user.id,
      loginUsername: "linked.parent",
      passwordHash: "argon2id-test-hash",
      email: "parent@example.com",
    },
  });
  await db.telegramIdentity.create({
    data: {
      userId: user.id,
      telegramUserId: BigInt("803441921"),
      telegramUsername: "linked_parent",
    },
  });

  assert.equal(await db.user.count(), 1);
  assert.equal(await db.webCredential.count(), 1);
  assert.equal(await db.telegramIdentity.count(), 1);
});

test("a Telegram identity cannot belong to two canonical Users", async () => {
  await resetFoundation();
  const first = await db.user.create({ data: {} });
  const second = await db.user.create({ data: {} });

  await db.telegramIdentity.create({
    data: { userId: first.id, telegramUserId: BigInt("803441922") },
  });

  await assert.rejects(() =>
    db.telegramIdentity.create({
      data: { userId: second.id, telegramUserId: BigInt("803441922") },
    }),
  );
});

test("account-link challenge stores a verifier, expiry, and single-consumption state", async () => {
  await resetFoundation();
  const user = await db.user.create({ data: {} });
  const challenge = await db.accountLinkChallenge.create({
    data: {
      userId: user.id,
      verifierHash: "sha256-test-verifier",
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  assert.equal(challenge.userId, user.id);
  assert.equal(challenge.verifierHash, "sha256-test-verifier");
  assert.equal(challenge.consumedAt, null);
  assert.ok(challenge.expiresAt.getTime() > Date.now());
});

test("concurrent redemption can consume one account-link challenge only once", async () => {
  await resetFoundation();
  const user = await db.user.create({ data: {} });
  const challenge = await db.accountLinkChallenge.create({
    data: {
      userId: user.id,
      verifierHash: "sha256-concurrency-verifier",
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });
  const now = new Date();

  const consume = () =>
    db.accountLinkChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });

  const results = await Promise.all([consume(), consume()]);
  assert.deepEqual(
    results.map((result) => result.count).sort(),
    [0, 1],
  );
});
