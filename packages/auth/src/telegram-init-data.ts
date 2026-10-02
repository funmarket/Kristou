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
  now?: Date;
  maxAgeSeconds: number;
}

export class TelegramInitDataError extends Error {
  override name = "TelegramInitDataError";
}

function fail(message: string): never {
  throw new TelegramInitDataError(message);
}

function parseTelegramUser(raw: string): TelegramInitDataUser {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail("Telegram user payload is invalid");
  }

  if (!parsed || typeof parsed !== "object") {
    return fail("Telegram user payload is invalid");
  }

  const user = parsed as Record<string, unknown>;
  if (
    typeof user.id !== "number" ||
    !Number.isSafeInteger(user.id) ||
    user.id <= 0
  ) {
    return fail("Telegram user id is invalid");
  }

  return {
    telegramUserId: BigInt(user.id),
    ...(typeof user.username === "string"
      ? { telegramUsername: user.username }
      : {}),
    ...(typeof user.first_name === "string" ? { firstName: user.first_name } : {}),
    ...(typeof user.last_name === "string" ? { lastName: user.last_name } : {}),
    ...(typeof user.language_code === "string"
      ? { languageCode: user.language_code }
      : {}),
  };
}

export function validateTelegramInitData(
  raw: string,
  botToken: string,
  options: TelegramInitDataValidationOptions,
): ValidatedTelegramInitData {
  if (!raw || !botToken) {
    return fail("Telegram initData credentials are missing");
  }
  if (!Number.isInteger(options.maxAgeSeconds) || options.maxAgeSeconds <= 0) {
    return fail("Telegram initData max age is invalid");
  }

  const params = new URLSearchParams(raw);
  const providedHash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");

  if (!providedHash || !/^[a-f0-9]{64}$/i.test(providedHash)) {
    return fail("Telegram initData hash is invalid");
  }
  if (!authDateRaw || !userRaw) {
    return fail("Telegram initData fields are missing");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest();
  const actualHash = Buffer.from(providedHash, "hex");

  if (
    actualHash.length !== expectedHash.length ||
    !timingSafeEqual(actualHash, expectedHash)
  ) {
    return fail("Telegram initData signature is invalid");
  }

  const authDateSeconds = Number(authDateRaw);
  if (!Number.isSafeInteger(authDateSeconds) || authDateSeconds <= 0) {
    return fail("Telegram initData auth_date is invalid");
  }

  const now = options.now ?? new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const ageSeconds = nowSeconds - authDateSeconds;
  if (ageSeconds < 0 || ageSeconds > options.maxAgeSeconds) {
    return fail("Telegram initData is outside the accepted age");
  }

  const queryId = params.get("query_id");
  return {
    authDate: new Date(authDateSeconds * 1000),
    ...(queryId ? { queryId } : {}),
    user: parseTelegramUser(userRaw),
  };
}
