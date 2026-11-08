import argon2 from "argon2";

/** Argon2id hashes only. Callers handle passwords as secrets, never log them. */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Password must be a non-empty string");
  }
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
    saltLength: 16,
  });
}

/** Invalid or unsupported stored hashes fail closed without leaking passwords. */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (
    typeof hash !== "string" ||
    !hash.startsWith("$argon2id$") ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return false;
  }
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
