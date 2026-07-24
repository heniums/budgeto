import { z } from 'zod';
import {
  findWalletById,
  findWalletsByUserIdWithBalance,
  deleteWallet,
  getWalletWithBalance,
  adjustBalanceAtomic,
  createWalletInTx,
  updateWalletInTx,
  adjustBalanceAtomicInTx,
} from './repository';
import {
  createCategory,
  findCategoryByUserIdAndName,
  findCategoryByUserIdAndNameInTx,
  createCategoryInTx,
} from '../categories/repository';
import { db } from '../db/client';
import { notFoundError } from '../errors';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SUPPORTED_CURRENCY_CODES = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BZD',
  'CAD',
  'CDF',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CUP',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ERN',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'FOK',
  'GBP',
  'GEL',
  'GGP',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'IMP',
  'INR',
  'IQD',
  'IRR',
  'ISK',
  'JEP',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KID',
  'KMF',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'LYD',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRU',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SDG',
  'SEK',
  'SGD',
  'SHP',
  'SLE',
  'SOS',
  'SRD',
  'SSP',
  'STN',
  'SYP',
  'SZL',
  'THB',
  'TJS',
  'TMT',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TVD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'USD',
  'UYU',
  'UZS',
  'VES',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XCD',
  'XDR',
  'XOF',
  'XPF',
  'YER',
  'ZAR',
  'ZMW',
  'ZWL',
] as const;

const currencyCodeSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.enum(SUPPORTED_CURRENCY_CODES),
);

const balanceSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (val === undefined) return true;
      const trimmed = val.trim();
      return trimmed !== '' && Number.isFinite(Number(trimmed));
    },
    { message: 'balance must be a valid finite number' },
  );

export const createWalletSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional().default(''),
  color: z.string().max(32).optional().default('#1f8a4c'),
  currency: currencyCodeSchema.optional().default('USD'),
  balance: balanceSchema.default('0'),
});
export const updateWalletSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).optional(),
  color: z.string().max(32).optional(),
  currency: currencyCodeSchema.optional(),
  balance: balanceSchema,
});

export const adjustBalanceSchema = z.object({
  targetBalance: z
    .string()
    .min(1, 'targetBalance is required')
    .refine((val) => Number.isFinite(Number(val)), {
      message: 'targetBalance must be a valid finite number',
    }),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;

export interface WalletResponse {
  id: string;
  name: string;
  description: string;
  color: string;
  currency: string;
  balance: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a wallet for the given user. The wallet insert and any initial
 * balance adjustment are wrapped in a single DB transaction so the database
 * is never left with a zero-balance wallet when the adjustment fails.
 */
export async function create(
  userId: string,
  input: CreateWalletInput,
): Promise<WalletResponse> {
  const { balance: initialBalance, ...walletMeta } = input;

  const wallet = await db.transaction(async (tx) => {
    const w = await createWalletInTx(tx, {
      userId,
      name: walletMeta.name,
      description: walletMeta.description,
      color: walletMeta.color,
      currency: walletMeta.currency,
    });

    const balance = initialBalance ?? '0';
    if (Number(balance) !== 0) {
      const cat = await findOrCreateAdjustmentCategoryInTx(userId, tx);
      await adjustBalanceAtomicInTx(tx, w.id, balance, cat.id);
    }
    return w;
  });

  const withBalance = await getWalletWithBalance(wallet.id);
  if (!withBalance) {
    throw notFoundError('Wallet not found');
  }
  return formatWalletWithBalanceRow(withBalance);
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
export async function get(id: string, userId: string): Promise<WalletResponse> {
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
 * Updates a wallet after verifying ownership. Metadata changes and balance
 * adjustments are wrapped in a single DB transaction.
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

  const { balance, ...metadata } = input;

  const hasMetadata =
    metadata.name !== undefined ||
    metadata.description !== undefined ||
    metadata.color !== undefined ||
    metadata.currency !== undefined;

  try {
    await db.transaction(async (tx) => {
      if (hasMetadata) {
        const updated = await updateWalletInTx(tx, id, metadata);
        if (!updated) {
          throw new Error('WALLET_NOT_FOUND');
        }
      }

      if (balance !== undefined) {
        const cat = await findOrCreateAdjustmentCategoryInTx(userId, tx);
        await adjustBalanceAtomicInTx(tx, id, balance, cat.id);
      }
    });
  } catch (err: unknown) {
    mapWalletNotFoundError(err);
  }

  const withBalance = await getWalletWithBalance(id);
  if (!withBalance) {
    throw notFoundError('Wallet not found');
  }
  return formatWalletWithBalanceRow(withBalance);
}

/**
 * Deletes a wallet after verifying ownership and confirming it has no
 * transactions.
 */
export async function remove(id: string, userId: string): Promise<void> {
  const wallet = await findWalletById(id);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }
  await deleteWallet(id);
}

const ADJUSTMENT_CATEGORY_NAME = 'Balance Adjustment';

async function findOrCreateAdjustmentCategory(userId: string): Promise<{
  id: string;
}> {
  let category = await findCategoryByUserIdAndName(
    userId,
    ADJUSTMENT_CATEGORY_NAME,
  );

  if (!category) {
    category = await createCategory({
      userId,
      name: ADJUSTMENT_CATEGORY_NAME,
      color: '#6b7280',
      icon: 'scale',
    });
  }

  return category;
}

async function findOrCreateAdjustmentCategoryInTx(
  userId: string,
  tx: Tx,
): Promise<{ id: string }> {
  let category = await findCategoryByUserIdAndNameInTx(
    tx,
    userId,
    ADJUSTMENT_CATEGORY_NAME,
  );

  if (!category) {
    category = await createCategoryInTx(tx, {
      userId,
      name: ADJUSTMENT_CATEGORY_NAME,
      color: '#6b7280',
      icon: 'scale',
    });
  }

  return category;
}

function mapWalletNotFoundError(err: unknown): never {
  if (err instanceof Error && err.message === 'WALLET_NOT_FOUND') {
    throw notFoundError('Wallet not found');
  }
  throw err;
}

/**
 * Adjusts a wallet balance to a target value by creating a balancing
 * transaction. Auto-creates a "Balance Adjustment" category for the
 * user if one doesn't exist yet.
 */
export async function adjustBalance(
  id: string,
  userId: string,
  input: AdjustBalanceInput,
): Promise<WalletResponse> {
  const wallet = await findWalletById(id);
  if (!wallet) {
    throw notFoundError('Wallet not found');
  }
  if (wallet.userId !== userId) {
    throw notFoundError('Wallet not found');
  }

  const target = input.targetBalance;
  const adjustmentCategory = await findOrCreateAdjustmentCategory(userId);

  // Atomically lock, compute delta, and insert transaction
  try {
    await adjustBalanceAtomic(id, target, adjustmentCategory.id);
  } catch (err: unknown) {
    mapWalletNotFoundError(err);
  }

  // Return the updated wallet with new balance
  const updated = await getWalletWithBalance(id);
  if (!updated) {
    throw notFoundError('Wallet not found');
  }
  return formatWalletWithBalanceRow(updated);
}

function formatWalletWithBalanceRow(row: {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  currency: string | null;
  balance: string;
  createdAt: Date;
  updatedAt: Date;
}): WalletResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    color: row.color ?? '#1f8a4c',
    currency: row.currency ?? 'USD',
    balance: row.balance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
