import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import {
  transactions,
  wallets,
  categories,
  type Transaction,
  type NewTransaction,
} from '../db/schema';

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
  return rows as Transaction[];
}
