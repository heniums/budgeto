import type { Request, Response, NextFunction } from 'express';
import {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  changePasswordSchema,
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} from './service';
import { notFoundError } from '../errors';

/**
 * HTTP handlers for the auth endpoints. Validation is delegated to zod schemas;
 * parse errors bubble to the central error handler as `ZodError`.
 */
export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await register(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw notFoundError('User not found');
    }
    const user = await getProfile(req.user.sub);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw notFoundError('User not found');
    }
    const input = profileUpdateSchema.parse(req.body);
    const user = await updateProfile(req.user.sub, input);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw notFoundError('User not found');
    }
    const input = changePasswordSchema.parse(req.body);
    await changePassword(req.user.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
