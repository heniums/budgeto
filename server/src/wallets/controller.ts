import type { Request, Response, NextFunction } from 'express';
import { getUser } from '../auth/middleware';
import {
  createWalletSchema,
  updateWalletSchema,
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
    const input = createWalletSchema.parse(req.body);
    const user = getUser(req);
    const wallet = await create(user.sub, input);
    res.status(201).json(wallet);
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
    const user = getUser(req);
    const wallet = await get(req.params.id, user.sub);
    res.status(200).json(wallet);
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
    const input = updateWalletSchema.parse(req.body);
    const user = getUser(req);
    const wallet = await update(req.params.id, user.sub, input);
    res.status(200).json(wallet);
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
    const user = getUser(req);
    await remove(req.params.id, user.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
