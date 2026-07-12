import type { Request, Response, NextFunction } from 'express';
import { AuthService, registerSchema, loginSchema } from './service';

/**
 * HTTP handlers for the auth endpoints. Validation is delegated to zod schemas;
 * parse errors bubble to the central error handler as `ZodError`.
 */
export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const input = registerSchema.parse(req.body);
      const result = await this.service.register(input);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await this.service.login(input);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
