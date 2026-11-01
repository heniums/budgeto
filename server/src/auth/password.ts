import bcrypt from 'bcryptjs';

export const SALT_ROUNDS = 10;

/**
 * Pre-computed bcrypt hash of an arbitrary pad value. Compared against on
 * login when the user does not exist so unknown emails cost the same as a
 * real bcrypt comparison. server/test/auth.service.test.ts pins its cost
 * factor to SALT_ROUNDS so the two cannot silently desync.
 */
export const DUMMY_HASH = '$2a$10$8zQ/71Q4lA/LpDRQseXe2eqUVOXxqgutX2xVevzHp92CZLPjloZsK';

/**
 * Hashes a plaintext password using bcrypt. Never store the plaintext.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a previously stored bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
