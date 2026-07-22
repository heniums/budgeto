import type { Request, Response, NextFunction } from 'express';
import { getUser } from '../auth/middleware';
import { z } from 'zod';
import {
  createBudgetSchema,
  updateBudgetSchema,
  create,
  list,
  get,
  update,
  remove,
} from './service';

const idParamSchema = z.string().uuid();

const periodQuerySchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format')
  .optional();

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createBudgetSchema.parse(req.body);
    const user = getUser(req);
    const budget = await create(user.sub, input);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
}

export async function listHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const period = periodQuerySchema.parse(req.query.period);
    const user = getUser(req);
    const result = await list(user.sub, period ?? undefined);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = idParamSchema.parse(req.params.id);
    const period = periodQuerySchema.parse(req.query.period);
    const user = getUser(req);
    const budget = await get(id, user.sub, period ?? undefined);
    res.status(200).json(budget);
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = updateBudgetSchema.parse(req.body);
    const id = idParamSchema.parse(req.params.id);
    const user = getUser(req);
    const budget = await update(id, user.sub, input);
    res.status(200).json(budget);
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = idParamSchema.parse(req.params.id);
    const user = getUser(req);
    await remove(id, user.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
