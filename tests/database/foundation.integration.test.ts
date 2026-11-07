import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

  const credential = await db.webCredential.create({
    data: {
      userId: first.id,
      loginUsername: "parent.ahmed",
      passwordHash: "argon2id-test-hash",
      email: null,
    },
  });

  assert.equal(credential.userId, first.id);
  assert.equal(credential.email, null);

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

  const credential = await db.webCredential.create({
    data: {
      userId: user.id,
      loginUsername: "linked.parent",
      passwordHash: "argon2id-test-hash",
      email: "parent@example.com",
    },
  });
  const telegram = await db.telegramIdentity.create({
    data: {
      userId: user.id,
      telegramUserId: BigInt("803441921"),
      telegramUsername: "linked_parent",
    },
  });

  assert.equal(credential.userId, user.id);
  assert.equal(telegram.userId, user.id);
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

test("WebSession persists only a token hash and represents expiry and revocation lifecycle", async () => {
  await resetFoundation();
  const user = await db.user.create({ data: {} });
  const expiresAt = new Date(Date.now() + 60 * 60_000);

  const session = await db.webSession.create({
    data: {
      userId: user.id,
      tokenHash: "sha256-session-token-hash",
      expiresAt,
    },
  });

  assert.equal(session.userId, user.id);
  assert.equal(session.tokenHash, "sha256-session-token-hash");
  assert.equal(session.expiresAt.getTime(), expiresAt.getTime());
  assert.equal(session.revokedAt, null);
  assert.equal(Object.hasOwn(session, "token"), false);
  assert.equal(Object.hasOwn(session, "rawToken"), false);

  const revokedAt = new Date();
  const revoked = await db.webSession.update({
    where: { id: session.id },
    data: { revokedAt },
  });

  assert.equal(revoked.revokedAt?.getTime(), revokedAt.getTime());
});

test("account-link challenge stores only a verifier hash plus expiry, consumption, and failed-attempt state", async () => {
  await resetFoundation();
  const user = await db.user.create({ data: {} });
  const plaintextCode = "842731";
  const verifierHash = createHash("sha256").update(plaintextCode).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  const challenge = await db.accountLinkChallenge.create({
    data: {
      userId: user.id,
      verifierHash,
      expiresAt,
    },
  });

  assert.equal(challenge.userId, user.id);
  assert.equal(challenge.verifierHash, verifierHash);
  assert.notEqual(challenge.verifierHash, plaintextCode);
  assert.equal(challenge.consumedAt, null);
  assert.equal(challenge.failedAttempts, 0);
  assert.equal(challenge.expiresAt.getTime(), expiresAt.getTime());
  assert.equal(Object.hasOwn(challenge, "code"), false);
  assert.equal(Object.hasOwn(challenge, "plaintextCode"), false);

  const failedAttempt = await db.accountLinkChallenge.update({
    where: { id: challenge.id },
    data: { failedAttempts: { increment: 1 } },
  });

  assert.equal(failedAttempt.failedAttempts, 1);
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
  assert.deepEqual(results.map((result) => result.count).sort(), [0, 1]);

  const consumed = await db.accountLinkChallenge.findUniqueOrThrow({
    where: { id: challenge.id },
  });
  assert.equal(consumed.consumedAt?.getTime(), now.getTime());
});

test("AuditLog persists safe actor, entity, request, and metadata references without secret-specific schema fields", async () => {
  await resetFoundation();
  const actor = await db.user.create({ data: {} });

  const audit = await db.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "FOUNDATION_TEST_ACTION",
      entityType: "User",
      entityId: actor.id,
      requestId: "request-foundation-001",
      metadata: {
        source: "foundation-integration-test",
        outcome: "success",
      },
    },
  });

  assert.equal(audit.actorUserId, actor.id);
  assert.equal(audit.action, "FOUNDATION_TEST_ACTION");
  assert.equal(audit.entityType, "User");
  assert.equal(audit.entityId, actor.id);
  assert.equal(audit.requestId, "request-foundation-001");
  assert.deepEqual(audit.metadata, {
    source: "foundation-integration-test",
    outcome: "success",
  });

  for (const secretField of [
    "password",
    "passwordHash",
    "token",
    "rawToken",
    "tokenHash",
    "linkCode",
    "verifierHash",
  ]) {
    assert.equal(Object.hasOwn(audit, secretField), false);
  }
});

test("OutboxEvent persists payload and represents pending, claim, retry, failure, and delivery lifecycle fields", async () => {
  await resetFoundation();
  const availableAt = new Date(Date.now() + 5_000);
  const payload = {
    notificationId: "notification-foundation-001",
    channel: "telegram",
  };

  const event = await db.outboxEvent.create({
    data: {
      topic: "foundation.test",
      aggregateType: "User",
      aggregateId: "user-foundation-001",
      payload,
      availableAt,
    },
  });

  assert.equal(event.status, "PENDING");
  assert.equal(event.attempts, 0);
  assert.equal(event.availableAt.getTime(), availableAt.getTime());
  assert.equal(event.claimedAt, null);
  assert.equal(event.deliveredAt, null);
  assert.equal(event.lastError, null);
  assert.deepEqual(event.payload, payload);

  const claimedAt = new Date();
  const claimed = await db.outboxEvent.update({
    where: { id: event.id },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      claimedAt,
    },
  });

  assert.equal(claimed.status, "PROCESSING");
  assert.equal(claimed.attempts, 1);
  assert.equal(claimed.claimedAt?.getTime(), claimedAt.getTime());

  const failed = await db.outboxEvent.update({
    where: { id: event.id },
    data: {
      status: "FAILED",
      lastError: "temporary delivery failure",
    },
  });

  assert.equal(failed.status, "FAILED");
  assert.equal(failed.lastError, "temporary delivery failure");

  const retryAvailableAt = new Date(Date.now() + 30_000);
  const retried = await db.outboxEvent.update({
    where: { id: event.id },
    data: {
      status: "PENDING",
      availableAt: retryAvailableAt,
      claimedAt: null,
    },
  });

  assert.equal(retried.status, "PENDING");
  assert.equal(retried.availableAt.getTime(), retryAvailableAt.getTime());
  assert.equal(retried.claimedAt, null);

  const deliveredAt = new Date();
  const delivered = await db.outboxEvent.update({
    where: { id: event.id },
    data: {
      status: "DELIVERED",
      deliveredAt,
      lastError: null,
    },
  });

  assert.equal(delivered.status, "DELIVERED");
  assert.equal(delivered.deliveredAt?.getTime(), deliveredAt.getTime());
  assert.equal(delivered.lastError, null);
});
