import type { Request, Response, NextFunction } from 'express';
import { getUser } from '../auth/middleware';
import {
  createTransactionSchema,
  transferSchema,
  create,
  list,
  listByUser,
  transfer,
} from './service';

export async function createTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createTransactionSchema.parse(req.body);
    const user = getUser(req);
    const tx = await create(user.sub, req.params.id, input);
    res.status(201).json(tx);
  } catch (error) {
    next(error);
  }
}

export async function listTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getUser(req);
    const result = await list(user.sub, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listAllTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getUser(req);
    const result = await listByUser(user.sub);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function transferHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = transferSchema.parse(req.body);
    const user = getUser(req);
    const result = await transfer(user.sub, input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
