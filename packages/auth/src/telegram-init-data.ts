import { createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramInitDataUser {
  telegramUserId: bigint;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export interface ValidatedTelegramInitData {
  authDate: Date;
  queryId?: string;
  user: TelegramInitDataUser;
}

export interface TelegramInitDataValidationOptions {
  maxAgeSeconds: number;
  now?: Date;
}

export class TelegramInitDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramInitDataError";
  }
}

function fail(message: string): never {
  throw new TelegramInitDataError(message);
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function validateTelegramInitData(
  raw: string,
  botToken: string,
  options: TelegramInitDataValidationOptions,
): ValidatedTelegramInitData {
  if (!raw || !botToken) fail("Telegram initData is required");
  if (!Number.isInteger(options.maxAgeSeconds) || options.maxAgeSeconds <= 0) {
    fail("Telegram initData max age is invalid");
  }

  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");

  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) fail("Telegram initData hash is invalid");
  if (!authDateRaw || !/^\d+$/.test(authDateRaw)) fail("Telegram auth_date is invalid");
  if (!userRaw) fail("Telegram initData user is missing");

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest();
  const suppliedHash = Buffer.from(hash, "hex");
  if (suppliedHash.length !== expectedHash.length || !timingSafeEqual(suppliedHash, expectedHash)) {
    fail("Telegram initData signature is invalid");
  }

  const authDateSeconds = Number(authDateRaw);
  if (!Number.isSafeInteger(authDateSeconds) || authDateSeconds <= 0) {
    fail("Telegram auth_date is invalid");
  }

  const nowSeconds = Math.floor((options.now?.getTime() ?? Date.now()) / 1000);
  if (authDateSeconds > nowSeconds + 30) fail("Telegram auth_date is in the future");
  if (nowSeconds - authDateSeconds > options.maxAgeSeconds) {
    fail("Telegram initData is stale");
  }

  let parsedUser: unknown;
  try {
    parsedUser = JSON.parse(userRaw);
  } catch {
    fail("Telegram initData user is malformed");
  }
  if (!parsedUser || typeof parsedUser !== "object" || Array.isArray(parsedUser)) {
    fail("Telegram initData user is malformed");
  }

  const record = parsedUser as Record<string, unknown>;
  const id = record.id;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    fail("Telegram user id is invalid");
  }

  const user: TelegramInitDataUser = { telegramUserId: BigInt(id) };
  const telegramUsername = optionalString(record, "username");
  const firstName = optionalString(record, "first_name");
  const lastName = optionalString(record, "last_name");
  const languageCode = optionalString(record, "language_code");
  if (telegramUsername !== undefined) user.telegramUsername = telegramUsername;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (languageCode !== undefined) user.languageCode = languageCode;

  const validated: ValidatedTelegramInitData = {
    authDate: new Date(authDateSeconds * 1000),
    user,
  };
  const queryId = params.get("query_id");
  if (queryId) validated.queryId = queryId;
  return validated;
}
