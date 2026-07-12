import { z } from 'zod';
import {
  createTransaction,
  findTransactionsByWalletId,
} from './repository';
import { findWalletById } from '../wallets/repository';
import { db } from '../db/client';
import { transactions } from '../db/schema';
import { notFoundError, validationError } from '../errors';

export const createTransactionSchema = z.object({
  amount: z.string().refine((val) => val !== '0' && !isNaN(Number(val)), {
    message: 'Amount must be a non-zero number',
  }),
  description: z.string().max(512).optional().default(''),
});

export const transferSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  amount: z.string().refine(
    (val) => {
      const n = Number(val);
      return !isNaN(n) && n > 0;
    },
    { message: 'Amount must be a positive number' },
  ),
  description: z.string().max(512).optional().default(''),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;

export async function create(
  userId: string,
  walletId: string,
  input: CreateTransactionInput,
) {
  const wallet = await findWalletById(walletId);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }

  const tx = await createTransaction({
    walletId,
    amount: input.amount,
    description: input.description,
  });

  return {
    id: tx.id,
    walletId: tx.walletId,
    amount: tx.amount,
    description: tx.description ?? '',
    createdAt: tx.createdAt,
  };
}

export async function list(
  userId: string,
  walletId: string,
) {
  const wallet = await findWalletById(walletId);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }

  const rows = await findTransactionsByWalletId(walletId);
  return {
    transactions: rows.map((tx) => ({
      id: tx.id,
      walletId: tx.walletId,
      amount: tx.amount,
      description: tx.description ?? '',
      createdAt: tx.createdAt,
    })),
  };
}

export async function transfer(
  userId: string,
  input: TransferInput,
) {
  if (input.sourceId === input.targetId) {
    throw validationError('Source and target wallets must be different');
  }

  const source = await findWalletById(input.sourceId);
  if (!source || source.userId !== userId) {
    throw notFoundError('Source wallet not found');
  }

  const target = await findWalletById(input.targetId);
  if (!target || target.userId !== userId) {
    throw notFoundError('Target wallet not found');
  }

  const result = await db.transaction(async (tx) => {
    const [withdrawal] = await tx
      .insert(transactions)
      .values({
        walletId: input.sourceId,
        amount: (-Number(input.amount)).toString(),
        description: input.description || 'Transfer',
      })
      .returning();

    const [deposit] = await tx
      .insert(transactions)
      .values({
        walletId: input.targetId,
        amount: input.amount,
        description: input.description || 'Transfer',
      })
      .returning();

    return { withdrawal, deposit };
  });

  return {
    sourceTransaction: {
      id: result.withdrawal.id,
      walletId: result.withdrawal.walletId,
      amount: result.withdrawal.amount,
      description: result.withdrawal.description ?? '',
      createdAt: result.withdrawal.createdAt,
    },
    targetTransaction: {
      id: result.deposit.id,
      walletId: result.deposit.walletId,
      amount: result.deposit.amount,
      description: result.deposit.description ?? '',
      createdAt: result.deposit.createdAt,
    },
  };
}
