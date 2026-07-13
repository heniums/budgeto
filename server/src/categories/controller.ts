import type { Request, Response, NextFunction } from 'express';
import {
  createCategorySchema,
  updateCategorySchema,
  create,
  list,
  get,
  update,
  remove,
} from './service';

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await create(req.user!.sub, input);
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
    const result = await list(req.user!.sub);
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
    const category = await get(req.params.id, req.user!.sub);
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
    const category = await update(req.params.id, req.user!.sub, input);
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
    await remove(req.params.id, req.user!.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
