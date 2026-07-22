import { z } from 'zod';
import {
  createWallet,
  findWalletById,
  findWalletsByUserIdWithBalance,
  updateWallet,
  deleteWallet,
  getWalletWithBalance,
} from './repository';
import {
  createCategory,
  findCategoriesByUserId,
} from '../categories/repository';
import { createTransaction } from '../transactions/repository';
import { notFoundError } from '../errors';

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

export const createWalletSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional().default(''),
  color: z.string().max(32).optional().default('#1f8a4c'),
  currency: currencyCodeSchema.optional().default('USD'),
});

export const updateWalletSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).optional(),
  color: z.string().max(32).optional(),
  currency: currencyCodeSchema.optional(),
});

export const adjustBalanceSchema = z.object({
  targetBalance: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'targetBalance must be a valid number',
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
    currency: input.currency,
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

  const withBalance = await getWalletWithBalance(id);
  if (!withBalance) {
    throw notFoundError('Wallet not found');
  }

  const target = input.targetBalance;
  const current = withBalance.balance;
  const delta = (
    Math.round((Number(target) - Number(current)) * 100) / 100
  ).toString();

  // Find or create "Balance Adjustment" category
  const userCategories = await findCategoriesByUserId(userId);
  let adjustmentCategory = userCategories.find(
    (c) => c.name === ADJUSTMENT_CATEGORY_NAME,
  );

  if (!adjustmentCategory) {
    adjustmentCategory = await createCategory({
      userId,
      name: ADJUSTMENT_CATEGORY_NAME,
      color: '#6b7280',
      icon: 'scale',
    });
  }

  // Create the balancing transaction
  await createTransaction({
    walletId: id,
    amount: delta,
    description: `Balance adjusted from ${current} to ${target}`,
    categoryId: adjustmentCategory.id,
  });

  // Return the updated wallet with new balance
  const updated = await getWalletWithBalance(id);
  if (!updated) {
    throw notFoundError('Wallet not found');
  }
  return formatWalletWithBalanceRow(updated);
}

function formatWalletResponse(wallet: {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WalletResponse {
  return {
    id: wallet.id,
    name: wallet.name,
    description: wallet.description ?? '',
    color: wallet.color ?? '#1f8a4c',
    currency: wallet.currency ?? 'USD',
    balance: '0',
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
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
