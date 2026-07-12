import { z } from 'zod';
import { UserRepository } from './repository';
import { hashPassword, verifyPassword } from './password';
import { signToken, type TokenPayload } from './token';
import { ConflictError, UnauthorizedError } from '../errors';

export const registerSchema = z.object({
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
  user: { id: string; email: string };
}

/**
 * Orchestrates registration and login, including password hashing and token issue.
 */
export class AuthService {
  constructor(private readonly repo = new UserRepository()) {}

  async register(input: RegisterInput): Promise<{ id: string; email: string }> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }
    const passwordHash = await hashPassword(input.password);
    const user = await this.repo.create({
      email: input.email,
      passwordHash,
    });
    return { id: user.id, email: user.email };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const token = signToken({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }
}

export const authService = new AuthService();
export type { TokenPayload };
