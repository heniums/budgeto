import type { Request, Response, NextFunction } from 'express';
import type { TokenPayload } from '../auth/token';
import { z } from 'zod';
import {
  createCategorySchema,
  updateCategorySchema,
  create,
  list,
  get,
  update,
  remove,
} from './service';

const idParamSchema = z.string().uuid();

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await create((req.user as TokenPayload).sub, input);
    res.status(201).json(category);
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
    const result = await list((req.user as TokenPayload).sub);
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
    const category = await get(id, (req.user as TokenPayload).sub);
    res.status(200).json(category);
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
    const input = updateCategorySchema.parse(req.body);
    const id = idParamSchema.parse(req.params.id);
    const category = await update(id, (req.user as TokenPayload).sub, input);
    res.status(200).json(category);
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
    await remove(id, (req.user as TokenPayload).sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
