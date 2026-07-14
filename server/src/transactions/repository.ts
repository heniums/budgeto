import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/client';
import {
  transactions,
  wallets,
  categories,
  type Transaction,
  type NewTransaction,
} from '../db/schema';

export interface TransactionWithCategory {
  id: string;
  walletId: string;
  amount: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: Date;
  userId: string;
}

export async function createTransaction(
  input: NewTransaction,
): Promise<Transaction> {
  const [tx] = await db.insert(transactions).values(input).returning();
  return tx;
}

export async function findTransactionsByWalletId(
  walletId: string,
): Promise<Transaction[]> {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.walletId, walletId))
    .orderBy(desc(transactions.createdAt));
}

export async function findTransactionById(
  txId: string,
): Promise<TransactionWithCategory | undefined> {
  const rows = await db
    .select({
      id: transactions.id,
      walletId: transactions.walletId,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      userId: wallets.userId,
    })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, txId));
  return rows[0];
}

export async function findTransactionsByUserId(
  userId: string,
): Promise<Transaction[]> {
  const rows = await db
    .select({
      id: transactions.id,
      walletId: transactions.walletId,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(wallets.userId, userId))
    .orderBy(desc(transactions.createdAt));
  return rows as unknown as Transaction[];
}
