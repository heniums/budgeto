import { and, desc, eq, gte, gt, ilike, lt, lte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import {
  transactions,
  wallets,
  categories,
  type Transaction,
  type NewTransaction,
} from '../db/schema';

export interface TransactionListFilters {
  from?: string;
  to?: string;
  walletId?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionRow {
  id: string;
  walletId: string;
  amount: string;
  description: string | null;
  createdAt: Date;
  date: string;
  categoryId: string | null;
  categoryName: string | null;
}

function buildTransactionConditions(
  userId: string,
  filters: TransactionListFilters,
): ReturnType<typeof and> {
  const conditions: ReturnType<typeof eq>[] = [eq(wallets.userId, userId)];
  if (filters.from) {
    conditions.push(gte(transactions.date, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(transactions.date, filters.to));
  }
  if (filters.walletId) {
    conditions.push(eq(transactions.walletId, filters.walletId));
  }
  if (filters.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }
  if (filters.type === 'income') {
    conditions.push(gt(transactions.amount, '0'));
  }
  if (filters.type === 'expense') {
    conditions.push(lt(transactions.amount, '0'));
  }
  if (filters.search) {
    conditions.push(ilike(transactions.description, `%${filters.search}%`));
  }
  return and(...conditions);
}

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

export async function updateTransaction(
  txId: string,
  input: Partial<
    Pick<
      NewTransaction,
      'amount' | 'description' | 'categoryId' | 'walletId' | 'date'
    >
  >,
): Promise<Transaction> {
  const [tx] = await db
    .update(transactions)
    .set(input)
    .where(eq(transactions.id, txId))
    .returning();
  return tx;
}

export async function deleteTransaction(txId: string): Promise<Transaction> {
  const [tx] = await db
    .delete(transactions)
    .where(eq(transactions.id, txId))
    .returning();
  return tx;
}

export async function findTransactionsByUserId(
  userId: string,
  filters: TransactionListFilters = {},
): Promise<TransactionRow[]> {
  const where = buildTransactionConditions(userId, filters);
  return db
    .select({
      id: transactions.id,
      walletId: transactions.walletId,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
      date: transactions.date,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(desc(transactions.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);
}

export async function countTransactionsByUserId(
  userId: string,
  filters: TransactionListFilters = {},
): Promise<number> {
  const where = buildTransactionConditions(userId, filters);
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where);
  return Number(row?.value ?? 0);
}

export async function sumTransactionsByUserAndCategoryAndMonth(
  userId: string,
  categoryId: string,
  month: string,
): Promise<string> {
  const [year, monthIndex] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1))
    .toISOString()
    .slice(0, 10);
  const end = new Date(Date.UTC(year, monthIndex, 0))
    .toISOString()
    .slice(0, 10);
  const where = and(
    eq(wallets.userId, userId),
    eq(transactions.categoryId, categoryId),
    gte(transactions.date, start),
    lte(transactions.date, end),
    lt(transactions.amount, '0'),
  );
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${transactions.amount}), '0')` })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .where(where);
  return row?.total ?? '0';
}

export async function deleteAllTransactions(): Promise<void> {
  await db.delete(transactions);
}
