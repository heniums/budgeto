import crypto from 'node:crypto';
import { z } from 'zod';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateUserPasswordHash,
  createRefreshToken,
  findRefreshTokenByHash,
  deleteRefreshToken,
  deleteAllRefreshTokensForUser,
} from './repository';
import { hashPassword, verifyPassword } from './password';
import { signToken, type TokenPayload } from './token';
import { conflictError, unauthorizedError } from '../errors';
import { getConfig } from '../config';

export const registerSchema = z.object({
  name: z.string().min(1).max(128),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userSettingsSchema = z.record(z.unknown());
export type UserSettings = z.infer<typeof userSettingsSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  settings: userSettingsSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AuthResult {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/**
 * Registers a new user, hashing the password and guarding against duplicates.
 * On success, issues a short-lived access JWT and an opaque refresh token.
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw conflictError('Email already registered');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
    settings: {},
  });
  const { accessToken, refreshToken, refreshExpiresAt } = await issueTokens(
    user.id,
    user.email,
    user.name,
  );
  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

/**
 * Authenticates a user and issues an access JWT plus a refresh token.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw unauthorizedError('Invalid credentials');
  }
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw unauthorizedError('Invalid credentials');
  }
  const { accessToken, refreshToken, refreshExpiresAt } = await issueTokens(
    user.id,
    user.email,
    user.name,
  );
  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

export type { TokenPayload };

/**
 * Returns the full profile (id, email, name, settings) for the given user id.
 */
export async function getProfile(
  id: string,
): Promise<{
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
}> {
  const user = await findUserById(id);
  if (!user) {
    throw unauthorizedError('User not found');
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    settings: user.settings as Record<string, unknown>,
  };
}

/**
 * Updates the display name and/or settings for the given user.
 */
export async function updateProfile(
  id: string,
  input: ProfileUpdateInput,
): Promise<{
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
}> {
  const updated = await updateUserProfile(id, input);
  if (!updated) {
    throw unauthorizedError('User not found');
  }
  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    settings: updated.settings as Record<string, unknown>,
  };
}

/**
 * Changes the password after verifying the current one. Rejects if the current
 * password is wrong, then stores a fresh bcrypt hash and revokes every refresh
 * token so all devices must sign in again.
 */
export async function changePassword(
  id: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await findUserById(id);
  if (!user) {
    throw unauthorizedError('User not found');
  }
  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw unauthorizedError('Current password is incorrect');
  }
  const passwordHash = await hashPassword(input.newPassword);
  await updateUserPasswordHash(id, passwordHash);
  await deleteAllRefreshTokensForUser(id);
}

/**
 * Rotates a valid refresh token: deletes the old one and issues a new pair.
 * Throws `unauthorizedError` when the token is missing, unknown, or expired.
 */
export async function refreshSession(
  rawRefreshToken: string,
): Promise<AuthResult> {
  const hash = hashRefreshToken(rawRefreshToken);
  const stored = await findRefreshTokenByHash(hash);
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    throw unauthorizedError('Invalid or expired refresh token');
  }
  await deleteRefreshToken(stored.id);
  const user = await findUserById(stored.userId);
  if (!user) {
    throw unauthorizedError('User not found');
  }
  const { accessToken, refreshToken, refreshExpiresAt } = await issueTokens(
    user.id,
    user.email,
    user.name,
  );
  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

/**
 * Invalidates a single refresh token (logout from one device). Idempotent —
 * succeeds even if the token is already gone.
 */
export async function logout(rawRefreshToken?: string): Promise<void> {
  if (!rawRefreshToken) {
    return;
  }
  const hash = hashRefreshToken(rawRefreshToken);
  const stored = await findRefreshTokenByHash(hash);
  if (stored) {
    await deleteRefreshToken(stored.id);
  }
}

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(
  userId: string,
  email: string,
  name: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}> {
  const accessToken = signToken({ sub: userId, email, name });
  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const refreshExpiresAt = new Date(
    Date.now() + getConfig().refreshTokenExpiresIn * 1000,
  );
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await createRefreshToken(userId, tokenHash, refreshExpiresAt);
  return { accessToken, refreshToken: rawRefreshToken, refreshExpiresAt };
}
