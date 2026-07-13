import type { Request, Response, NextFunction } from 'express';
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
import { unauthorizedError } from '../errors';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw unauthorizedError();
  }
  return req.user.sub;
}

const idParamSchema = z.string().uuid();

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await create(requireUserId(req), input);
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
    const result = await list(requireUserId(req));
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
    const category = await get(id, requireUserId(req));
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
    const category = await update(id, requireUserId(req), input);
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
    await remove(id, requireUserId(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
