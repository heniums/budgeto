import { z } from 'zod';
import {
  createWallet,
  findWalletById,
  findWalletsByUserIdWithBalance,
  updateWallet,
  deleteWallet,
  walletHasTransactions,
  getWalletWithBalance,
} from './repository';
import { notFoundError, conflictError } from '../errors';

export const createWalletSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional().default(''),
  color: z.string().max(32).optional().default('#1f8a4c'),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).optional(),
  color: z.string().max(32).optional(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;

export interface WalletResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  balance: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a wallet for the given user.
 */
export async function create(
  userId: string,
  input: CreateWalletInput,
): Promise<WalletResponse> {
  const wallet = await createWallet({
    userId,
    name: input.name,
    description: input.description,
    color: input.color,
  });
  return formatWalletResponse(wallet);
}

/**
 * Lists all wallets for the given user, each with a computed balance.
 */
export async function list(
  userId: string,
): Promise<{ wallets: WalletResponse[] }> {
  const rows = await findWalletsByUserIdWithBalance(userId);
  return {
    wallets: rows.map(formatWalletWithBalanceRow),
  };
}

/**
 * Returns a single wallet by id, with balance. Throws if not found or
 * owned by a different user.
 */
export async function get(
  id: string,
  userId: string,
): Promise<WalletResponse> {
  const wallet = await findWalletById(id);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }
  const withBalance = await getWalletWithBalance(id);
  if (!withBalance) {
    throw notFoundError('Wallet not found');
  }
  return formatWalletWithBalanceRow(withBalance);
}

/**
 * Updates a wallet after verifying ownership.
 */
export async function update(
  id: string,
  userId: string,
  input: UpdateWalletInput,
): Promise<WalletResponse> {
  const wallet = await findWalletById(id);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }
  const updated = await updateWallet(id, input);
  if (!updated) {
    throw notFoundError('Wallet not found');
  }
  return formatWalletResponse(updated);
}

/**
 * Deletes a wallet after verifying ownership and confirming it has no
 * transactions.
 */
export async function remove(
  id: string,
  userId: string,
): Promise<void> {
  const wallet = await findWalletById(id);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }
  const hasTransactions = await walletHasTransactions(id);
  if (hasTransactions) {
    throw conflictError(
      'Wallet has associated transactions. Reassign or delete transactions first.',
    );
  }
  await deleteWallet(id);
}

function formatWalletResponse(
  wallet: { id: string; name: string; description: string | null; color: string | null; createdAt: Date; updatedAt: Date },
): WalletResponse {
  return {
    id: wallet.id,
    name: wallet.name,
    description: wallet.description ?? '',
    color: wallet.color ?? '#1f8a4c',
    balance: '0',
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

function formatWalletWithBalanceRow(
  row: { id: string; name: string; description: string | null; color: string | null; balance: string; createdAt: Date; updatedAt: Date },
): WalletResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    color: row.color ?? '#1f8a4c',
    balance: row.balance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
