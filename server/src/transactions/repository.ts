import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { transactions, type Transaction, type NewTransaction } from '../db/schema';

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
