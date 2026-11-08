import { createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramInitDataOptions {
  /** Current Unix timestamp in whole seconds; omit in production. */
  nowSeconds?: number;
  /** Maximum accepted authentication age in seconds (default: 86400). */
  maxAgeSeconds?: number;
  /** Maximum tolerated future clock skew in seconds (default: 60). */
  futureSkewSeconds?: number;
}

/**
 * Validate raw, unmodified Telegram Mini App initData (not initDataUnsafe).
 * Does not create, link, or authorize a KRISTOU User; that is server policy.
 */
export function validateTelegramInitData(
  raw: string,
  botToken: string,
  options: TelegramInitDataOptions = {},
): boolean {
  if (
    typeof raw !== "string" ||
    raw.length === 0 ||
    raw.length > 16_384 ||
    typeof botToken !== "string" ||
    botToken.length === 0
  ) {
    return false;
  }

  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAge = options.maxAgeSeconds ?? 86_400;
  const futureSkew = options.futureSkewSeconds ?? 60;
  if (
    !Number.isSafeInteger(now) ||
    !Number.isSafeInteger(maxAge) ||
    maxAge < 0 ||
    !Number.isSafeInteger(futureSkew) ||
    futureSkew < 0
  ) {
    return false;
  }

  try {
    const params = new URLSearchParams(raw);
    const fields = new Map<string, string>();
    for (const [key, value] of params.entries()) {
      // Duplicate fields are ambiguous and must never be accepted.
      if (!key || fields.has(key)) return false;
      fields.set(key, value);
    }
    const supplied = fields.get("hash");
    const timestamp = fields.get("auth_date");
    if (
      !supplied ||
      !/^[0-9a-fA-F]{64}$/.test(supplied) ||
      !timestamp ||
      !/^[0-9]+$/.test(timestamp)
    ) {
      return false;
    }
    const authDate = Number(timestamp);
    if (!Number.isSafeInteger(authDate) || authDate <= 0) return false;
    if (now - authDate > maxAge || authDate - now > futureSkew) return false;

    fields.delete("hash");
    // Telegram HMAC check uses all remaining fields, sorted by key, joined with LF.
    const dataCheckString = [...fields.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
    const expected = createHmac("sha256", secret).update(dataCheckString).digest();
    return timingSafeEqual(expected, Buffer.from(supplied, "hex"));
  } catch {
    return false;
  }
}
