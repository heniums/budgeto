import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import {
  budgets,
  budgetCategories,
  transactions,
  wallets,
  type Budget,
  type NewBudget,
  type BudgetCategory,
  type NewBudgetCategory,
} from '../db/schema';

export interface BudgetWithCategories {
  budget: Budget;
  categories: Array<{
    categoryId: string;
    limitAmount: string;
  }>;
}

export async function createBudget(input: NewBudget): Promise<Budget> {
  const [budget] = await db.insert(budgets).values(input).returning();
  return budget;
}

export async function createBudgetCategory(
  input: NewBudgetCategory,
): Promise<BudgetCategory> {
  const [row] = await db.insert(budgetCategories).values(input).returning();
  return row;
}

export async function findBudgetsByUserId(userId: string): Promise<Budget[]> {
  return db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(budgets.startDate, budgets.createdAt);
}

export async function findBudgetById(id: string): Promise<Budget | undefined> {
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
  return budget;
}

export async function findBudgetCategories(
  budgetId: string,
): Promise<BudgetCategory[]> {
  return db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.budgetId, budgetId));
}

export async function findBudgetCategory(
  budgetId: string,
  categoryId: string,
): Promise<BudgetCategory | undefined> {
  const [row] = await db
    .select()
    .from(budgetCategories)
    .where(
      and(
        eq(budgetCategories.budgetId, budgetId),
        eq(budgetCategories.categoryId, categoryId),
      ),
    );
  return row;
}

export async function deleteBudgetCategories(budgetId: string): Promise<void> {
  await db
    .delete(budgetCategories)
    .where(eq(budgetCategories.budgetId, budgetId));
}

export async function sumTransactionsByUserAndCategoryAndRange(
  userId: string,
  categoryId: string,
  startDate: string,
  endDate: string,
): Promise<string> {
  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        eq(wallets.userId, userId),
        eq(transactions.categoryId, categoryId),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} <= ${endDate}`,
      ),
    );
  return row?.total ?? '0';
}

export async function updateBudget(
  id: string,
  input: Partial<
    Pick<
      NewBudget,
      | 'name'
      | 'icon'
      | 'color'
      | 'type'
      | 'period'
      | 'startDate'
      | 'endDate'
      | 'totalAmount'
    >
  >,
): Promise<Budget | undefined> {
  const [budget] = await db
    .update(budgets)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(budgets.id, id))
    .returning();
  return budget;
}

export async function deleteBudget(id: string): Promise<Budget | undefined> {
  const [budget] = await db
    .delete(budgets)
    .where(eq(budgets.id, id))
    .returning();
  return budget;
}

export async function deleteAllBudgets(): Promise<void> {
  await db.delete(budgets);
}

export type { Budget, BudgetCategory };
