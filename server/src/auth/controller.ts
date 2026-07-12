import type { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, register, login } from './service';

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
