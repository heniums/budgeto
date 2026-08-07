import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { db } from '../db/client';
import { transactions, wallets, categories, userWidgets } from '../db/schema';

export interface MonthlyCashFlowRow {
  month: string;
  income: string;
  expense: string;
  net: string;
}

export async function getMonthlyCashFlow(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MonthlyCashFlowRow[]> {
  const rows = await db
    .select({
      month: sql<string>`date_trunc('month', ${transactions.date})::text`,
      income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), '0')`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        eq(wallets.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .groupBy(sql`date_trunc('month', ${transactions.date})`)
    .orderBy(sql`date_trunc('month', ${transactions.date})`);
  return rows.map((r) => ({
    month: r.month,
    income: r.income,
    expense: r.expense,
    net: (Number(r.income) - Number(r.expense)).toFixed(2),
  }));
}

export interface BiggestExpenseRow {
  id: string;
  description: string | null;
  amount: string;
  date: string;
  categoryName: string | null;
}

export interface ThisMonthStats {
  income: string;
  expense: string;
  net: string;
  dailySpendingRate: string;
  biggestExpense: BiggestExpenseRow | null;
}

export async function getThisMonthStats(
  userId: string,
  startDate: string,
  endDate: string,
  daysElapsed: number,
): Promise<ThisMonthStats> {
  const [incomeRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        eq(wallets.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.amount} > 0`,
      ),
    );

  const [expenseRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        eq(wallets.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.amount} < 0`,
      ),
    );

  const income = incomeRow?.total ?? '0';
  const expense = expenseRow?.total ?? '0';
  const net = (Number(income) - Number(expense)).toFixed(2);
  const dailySpendingRate = (
    Number(expense) / Math.max(1, daysElapsed)
  ).toFixed(2);

  const [biggestRow] = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      amount: sql<string>`ABS(${transactions.amount})`,
      date: transactions.date,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(wallets.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.amount} < 0`,
      ),
    )
    .orderBy(transactions.amount)
    .limit(1);

  return {
    income,
    expense,
    net,
    dailySpendingRate,
    biggestExpense: biggestRow
      ? {
          id: biggestRow.id,
          description: biggestRow.description ?? null,
          amount: biggestRow.amount,
          date: biggestRow.date,
          categoryName: biggestRow.categoryName ?? null,
        }
      : null,
  };
}

export interface CategorySpendingRow {
  categoryId: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  amount: string;
}

export async function getSpendingByCategory(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<CategorySpendingRow[]> {
  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      name: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      color: sql<string>`COALESCE(${categories.color}, '#64748b')`,
      icon: sql<string>`COALESCE(${categories.icon}, 'help-circle')`,
      amount: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(wallets.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.amount} < 0`,
      ),
    )
    .groupBy(
      transactions.categoryId,
      categories.name,
      categories.color,
      categories.icon,
    )
    .orderBy(sql`SUM(ABS(${transactions.amount})) DESC`);
  return rows;
}

export interface RecentTransactionRow {
  id: string;
  description: string;
  amount: string;
  date: string;
  categoryName: string | null;
  walletName: string;
}

export async function findRecentTransactions(
  userId: string,
  limit: number,
): Promise<RecentTransactionRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      description: sql<string>`COALESCE(${transactions.description}, '')`,
      amount: transactions.amount,
      date: transactions.date,
      categoryName: categories.name,
      walletName: wallets.name,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(eq(wallets.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    date: r.date,
    categoryName: r.categoryName ?? null,
    walletName: r.walletName,
  }));
}

export interface UserWidgetRow {
  id: string;
  userId: string;
  widgetId: string;
  visible: boolean;
  order: number;
  colSpan: number;
  rowSpan: number;
  config: Record<string, unknown>;
}

export async function findWidgetsByUserId(
  userId: string,
): Promise<UserWidgetRow[]> {
  const rows = await db
    .select()
    .from(userWidgets)
    .where(eq(userWidgets.userId, userId))
    .orderBy(userWidgets.order);
  return rows.map((r) => ({
    ...r,
    config: (r.config ?? {}) as Record<string, unknown>,
  })) as UserWidgetRow[];
}

export async function upsertUserWidgets(
  userId: string,
  widgets: {
    widgetId: string;
    visible: boolean;
    order: number;
    colSpan: number;
    rowSpan: number;
    config: Record<string, unknown>;
  }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(userWidgets).where(eq(userWidgets.userId, userId));
    if (widgets.length > 0) {
      await tx.insert(userWidgets).values(
        widgets.map((w) => ({
          userId,
          widgetId: w.widgetId,
          visible: w.visible,
          order: w.order,
          colSpan: w.colSpan,
          rowSpan: w.rowSpan,
          config: w.config,
        })),
      );
    }
  });
}
// ─── Filtered query helpers ─────────────────────────────────────────────────

function buildWalletFilter(walletIds?: string[]) {
  if (walletIds && walletIds.length > 0) {
    return inArray(wallets.id, walletIds);
  }
  return sql`1=1`;
}

function buildCategoryFilter(categoryIds?: string[]) {
  if (categoryIds && categoryIds.length > 0) {
    return inArray(transactions.categoryId, categoryIds);
  }
  return undefined;
}

export async function getWalletsByUserIdWithBalance(
  userId: string,
  walletIds?: string[],
): Promise<
  {
    id: string;
    name: string;
    color: string | null;
    currency: string;
    balance: string;
  }[]
> {
  const conditions = [eq(wallets.userId, userId), buildWalletFilter(walletIds)];
  const rows = await db
    .select({
      id: wallets.id,
      name: wallets.name,
      color: wallets.color,
      currency: wallets.currency,
      balance: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(wallets)
    .leftJoin(transactions, eq(wallets.id, transactions.walletId))
    .where(and(...conditions))
    .groupBy(wallets.id)
    .orderBy(wallets.createdAt);
  return rows;
}

export async function getCashFlowByInterval(
  userId: string,
  interval: 'day' | 'week' | 'month' | 'year',
  startDate: string,
  endDate: string,
  walletIds?: string[],
  categoryIds?: string[],
): Promise<
  { period: string; income: string; expense: string; net: string }[]
> {
  const truncUnit = interval;
  const truncExpr = sql.raw(`date_trunc('${truncUnit}', "transaction"."date")`);
  const catFilter = buildCategoryFilter(categoryIds);
  const conditions = [
    eq(wallets.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    buildWalletFilter(walletIds),
    catFilter,
  ];

  const rows = await db
    .select({
      period: sql<string>`(${truncExpr})::text`,
      income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), '0')`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(and(...conditions.filter(Boolean)))
    .groupBy(truncExpr)
    .orderBy(truncExpr);
  return rows.map((r) => ({
    period: r.period,
    income: r.income,
    expense: r.expense,
    net: (Number(r.income) - Number(r.expense)).toFixed(2),
  }));
}

export async function getIncomeVsExpense(
  userId: string,
  startDate: string,
  endDate: string,
  walletIds?: string[],
  categoryIds?: string[],
): Promise<{ income: string; expense: string; net: string }> {
  const catFilter = buildCategoryFilter(categoryIds);
  const conditions = [
    eq(wallets.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    buildWalletFilter(walletIds),
    catFilter,
  ];

  const [incomeRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        ...conditions.filter(Boolean),
        sql`${transactions.amount} > 0`,
      ),
    );

  const [expenseRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        ...conditions.filter(Boolean),
        sql`${transactions.amount} < 0`,
      ),
    );

  const income = incomeRow?.total ?? '0';
  const expense = expenseRow?.total ?? '0';
  const net = (Number(income) - Number(expense)).toFixed(2);
  return { income, expense, net };
}

export async function getSpendingByCategoryFiltered(
  userId: string,
  startDate: string,
  endDate: string,
  walletIds?: string[],
  categoryIds?: string[],
): Promise<CategorySpendingRow[]> {
  const catFilter = buildCategoryFilter(categoryIds);
  const conditions = [
    eq(wallets.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    buildWalletFilter(walletIds),
    sql`${transactions.amount} < 0`,
    catFilter,
  ];

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      name: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      color: sql<string>`COALESCE(${categories.color}, '#64748b')`,
      icon: sql<string>`COALESCE(${categories.icon}, 'help-circle')`,
      amount: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(...conditions.filter(Boolean)))
    .groupBy(
      transactions.categoryId,
      categories.name,
      categories.color,
      categories.icon,
    )
    .orderBy(sql`SUM(ABS(${transactions.amount})) DESC`);
  return rows;
}

export async function getRecentTransactionsFiltered(
  userId: string,
  limit: number,
  walletIds?: string[],
  categoryIds?: string[],
): Promise<RecentTransactionRow[]> {
  const catFilter = buildCategoryFilter(categoryIds);
  const conditions = [
    eq(wallets.userId, userId),
    buildWalletFilter(walletIds),
    catFilter,
  ];

  const rows = await db
    .select({
      id: transactions.id,
      description: sql<string>`COALESCE(${transactions.description}, '')`,
      amount: transactions.amount,
      date: transactions.date,
      categoryName: categories.name,
      walletName: wallets.name,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(...conditions.filter(Boolean)))
    .orderBy(desc(transactions.date))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    date: r.date,
    categoryName: r.categoryName ?? null,
    walletName: r.walletName,
  }));
}

export async function getBiggestExpenseFiltered(
  userId: string,
  startDate: string,
  endDate: string,
  walletIds?: string[],
  categoryIds?: string[],
): Promise<BiggestExpenseRow | null> {
  const catFilter = buildCategoryFilter(categoryIds);
  const conditions = [
    eq(wallets.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    buildWalletFilter(walletIds),
    sql`${transactions.amount} < 0`,
    catFilter,
  ];

  const [biggestRow] = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      amount: sql<string>`ABS(${transactions.amount})`,
      date: transactions.date,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(...conditions.filter(Boolean)))
    .orderBy(transactions.amount)
    .limit(1);

  if (!biggestRow) return null;
  return {
    id: biggestRow.id,
    description: biggestRow.description ?? null,
    amount: biggestRow.amount,
    date: biggestRow.date,
    categoryName: biggestRow.categoryName ?? null,
  };
}

export async function getDailySpendingRateFiltered(
  userId: string,
  startDate: string,
  endDate: string,
  walletIds?: string[],
  categoryIds?: string[],
): Promise<string> {
  const catFilter = buildCategoryFilter(categoryIds);
  const conditions = [
    eq(wallets.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
    buildWalletFilter(walletIds),
    sql`${transactions.amount} < 0`,
    catFilter,
  ];

  const [expenseRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), '0')`,
    })
    .from(transactions)
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(and(...conditions.filter(Boolean)));

  const totalExpense = Number(expenseRow?.total ?? '0');
  const start = dayjs(startDate).utc();
  const end = dayjs(endDate).utc();
  const totalDays = Math.max(1, end.diff(start, 'day') + 1);
  return (totalExpense / totalDays).toFixed(2);
}
