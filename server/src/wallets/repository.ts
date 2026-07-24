import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import {
  wallets,
  transactions,
  type Wallet,
  type NewWallet,
} from '../db/schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function createWallet(input: NewWallet): Promise<Wallet> {
  const [wallet] = await db.insert(wallets).values(input).returning();
  return wallet;
}

export async function findWalletById(id: string): Promise<Wallet | undefined> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
  return wallet;
}

export async function findWalletsByUserId(userId: string): Promise<Wallet[]> {
  return db.select().from(wallets).where(eq(wallets.userId, userId));
}

export async function getWalletWithBalance(
  id: string,
): Promise<(Wallet & { balance: string }) | undefined> {
  const [row] = await db
    .select({
      id: wallets.id,
      userId: wallets.userId,
      name: wallets.name,
      description: wallets.description,
      color: wallets.color,
      currency: wallets.currency,
      createdAt: wallets.createdAt,
      updatedAt: wallets.updatedAt,
      balance: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(wallets)
    .leftJoin(transactions, eq(wallets.id, transactions.walletId))
    .where(eq(wallets.id, id))
    .groupBy(wallets.id);
  return row;
}

export async function findWalletsByUserIdWithBalance(
  userId: string,
): Promise<(Wallet & { balance: string })[]> {
  const rows = await db
    .select({
      id: wallets.id,
      userId: wallets.userId,
      name: wallets.name,
      description: wallets.description,
      color: wallets.color,
      currency: wallets.currency,
      createdAt: wallets.createdAt,
      updatedAt: wallets.updatedAt,
      balance: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(wallets)
    .leftJoin(transactions, eq(wallets.id, transactions.walletId))
    .where(eq(wallets.userId, userId))
    .groupBy(wallets.id)
    .orderBy(wallets.createdAt);
  return rows;
}

export async function walletHasTransactions(
  walletId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ count: sql<number>`CAST(COUNT(*) AS int)` })
    .from(transactions)
    .where(eq(transactions.walletId, walletId));
  return (row?.count ?? 0) > 0;
}

export async function updateWallet(
  id: string,
  input: Partial<Pick<NewWallet, 'name' | 'description' | 'color' | 'currency'>>,
): Promise<Wallet | undefined> {
  const [wallet] = await db
    .update(wallets)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(wallets.id, id))
    .returning();
  return wallet;
}

export async function deleteWallet(id: string): Promise<Wallet | undefined> {
  const [wallet] = await db
    .delete(wallets)
    .where(eq(wallets.id, id))
    .returning();
  return wallet;
}

export async function deleteAllTransactions(): Promise<void> {
  await db.delete(transactions);
}

export async function deleteAllWallets(): Promise<void> {
  await db.delete(wallets);
}

export type { Wallet };

export async function createWalletInTx(
  tx: Tx,
  input: NewWallet,
): Promise<Wallet> {
  const [wallet] = await tx.insert(wallets).values(input).returning();
  return wallet;
}

export async function updateWalletInTx(
  tx: Tx,
  id: string,
  input: Partial<Pick<NewWallet, 'name' | 'description' | 'color' | 'currency'>>,
): Promise<Wallet | undefined> {
  const [wallet] = await tx
    .update(wallets)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(wallets.id, id))
    .returning();
  return wallet;
}

export async function adjustBalanceAtomicInTx(
  tx: Tx,
  walletId: string,
  targetBalance: string,
  categoryId: string,
): Promise<void> {
  // Lock the wallet row to prevent concurrent balance reads
  const [locked] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.id, walletId))
    .for('update');

  if (!locked) {
    throw new Error('WALLET_NOT_FOUND');
  }

  // Compute current balance within the locked transaction
  const [balanceRow] = await tx
    .select({
      balance: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.walletId, walletId));

  const current = balanceRow?.balance ?? '0';
  const delta = (
    Math.round((Number(targetBalance) - Number(current)) * 100) / 100
  ).toString();

  // Skip the insert when there is no actual change
  if (delta === '0') {
    return;
  }

  const description = `Balance adjusted from ${current} to ${targetBalance}`;

  await tx.insert(transactions).values({
    walletId,
    amount: delta,
    description,
    categoryId,
  });
}

export async function adjustBalanceAtomic(
  walletId: string,
  targetBalance: string,
  categoryId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await adjustBalanceAtomicInTx(tx, walletId, targetBalance, categoryId);
  });
}
