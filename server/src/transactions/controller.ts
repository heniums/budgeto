import type { Request, Response, NextFunction } from 'express';
import {
  createTransactionSchema,
  transferSchema,
  create,
  list,
  transfer,
} from './service';

export async function createTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createTransactionSchema.parse(req.body);
    const tx = await create(req.user!.sub, req.params.id, input);
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
    const result = await list(req.user!.sub, req.params.id);
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
    const result = await transfer(req.user!.sub, input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
