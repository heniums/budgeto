import { z } from 'zod';
import { findUserByEmail, createUser } from './repository';
import { hashPassword, verifyPassword } from './password';
import { signToken, type TokenPayload } from './token';
import { conflictError, unauthorizedError } from '../errors';

export const registerSchema = z.object({
  name: z.string().min(1).max(128),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string };
}

/**
 * Registers a new user, hashing the password and guarding against duplicates.
 */
export async function register(
  input: RegisterInput,
): Promise<{ id: string; email: string; name: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw conflictError('Email already registered');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
  });
  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Authenticates a user and issues a JWT on success.
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
  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export type { TokenPayload };
