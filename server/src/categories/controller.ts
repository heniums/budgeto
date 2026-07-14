import type { Request, Response, NextFunction } from 'express';
import { getUser } from '../auth/middleware';
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
    const user = getUser(req);
    const category = await create(user.sub, input);
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
    const user = getUser(req);
    const result = await list(user.sub);
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
    const user = getUser(req);
    const category = await get(id, user.sub);
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
    const user = getUser(req);
    const category = await update(id, user.sub, input);
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
    const user = getUser(req);
    await remove(id, user.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
