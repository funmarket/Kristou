import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Only the issuance layer should return this raw token to the authenticated caller. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Store the hash, not the raw token. No logging of either secret. */
export function hashSessionToken(token: string): string {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new TypeError("Invalid opaque session token");
  }
  const bytes = Buffer.from(token, "base64url");
  if (bytes.length !== 32 || bytes.toString("base64url") !== token) {
    throw new TypeError("Invalid opaque session token encoding");
  }
  return createHash("sha256").update(bytes).digest("hex");
}

/** Compare fixed-size SHA-256 hex digests in constant time. */
export function verifySessionTokenHash(token: string, storedHash: string): boolean {
  if (typeof storedHash !== "string" || !/^[0-9a-f]{64}$/.test(storedHash)) {
    return false;
  }
  try {
    const computed = Buffer.from(hashSessionToken(token), "hex");
    const stored = Buffer.from(storedHash, "hex");
    return timingSafeEqual(computed, stored);
  } catch {
    return false;
  }
}
