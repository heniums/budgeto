import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { findWalletsByUserIdWithBalance } from '../wallets/repository';
import { list as listBudgets } from '../budgets/service';
import type { BudgetResponse } from '../budgets/helpers';
import {
  getMonthlyCashFlow,
  getThisMonthStats,
  getSpendingByCategory,
  findRecentTransactions,
  findWidgetsByUserId,
  upsertUserWidgets,
  getWalletsByUserIdWithBalance,
  getCashFlowByInterval,
  getIncomeVsExpense,
  getSpendingByCategoryFiltered,
  getRecentTransactionsFiltered,
  getBiggestExpenseFiltered,
  getDailySpendingRateFiltered,
} from './repository';
import type { DateInterval } from './types';

export interface DashboardSummary {
  period: { month: string; startDate: string; endDate: string };
  wallets: {
    id: string;
    name: string;
    color: string;
    currency: string;
    balance: string;
  }[];
  monthlyCashFlow: {
    month: string;
    income: string;
    expense: string;
    net: string;
  }[];
  thisMonth: {
    income: string;
    expense: string;
    net: string;
    dailySpendingRate: string;
    biggestExpense: {
      id: string;
      description: string | null;
      amount: string;
      date: string;
      categoryName: string | null;
    } | null;
  };
  spendingByCategory: {
    categoryId: string | null;
    name: string;
    color: string | null;
    icon: string | null;
    amount: string;
  }[];
  recentTransactions: {
    id: string;
    description: string;
    amount: string;
    date: string;
    categoryName: string | null;
    walletName: string;
  }[];
  budgets: BudgetResponse[];
}

export async function getSummary(
  userId: string,
  referenceDate?: Date,
): Promise<DashboardSummary> {
  const now = referenceDate ? dayjs(referenceDate).utc() : dayjs().utc();
  const monthStart = now.startOf('month').toISOString();
  const monthEnd = now.endOf('month').toISOString();
  const sixMonthsAgo = now.subtract(5, 'month').startOf('month').toISOString();

  const [
    wallets,
    monthlyCashFlow,
    thisMonth,
    spendingByCategory,
    recentTransactions,
    budgetResult,
  ] = await Promise.all([
    findWalletsByUserIdWithBalance(userId),
    getMonthlyCashFlow(userId, sixMonthsAgo, monthEnd),
    getThisMonthStats(userId, monthStart, monthEnd, now.date()),
    getSpendingByCategory(userId, monthStart, monthEnd),
    findRecentTransactions(userId, 5),
    listBudgets(userId, now.format('YYYY-MM')),
  ]);

  return {
    period: {
      month: now.format('YYYY-MM'),
      startDate: monthStart,
      endDate: monthEnd,
    },
    wallets: wallets.map((w) => ({
      id: w.id,
      name: w.name,
      color: w.color ?? '#1f8a4c',
      currency: w.currency,
      balance: w.balance,
    })),
    monthlyCashFlow,
    thisMonth,
    spendingByCategory,
    recentTransactions,
    budgets: budgetResult.budgets,
  };
}

export interface WidgetConfigInput {
  widgetId: string;
  visible: boolean;
  order: number;
  colSpan: number;
  rowSpan: number;
  config: Record<string, unknown>;
}

export async function getWidgetsByUser(
  userId: string,
): Promise<WidgetConfigInput[]> {
  const rows = await findWidgetsByUserId(userId);
  return rows.map((r) => ({
    widgetId: r.widgetId,
    visible: r.visible,
    order: r.order,
    colSpan: r.colSpan,
    rowSpan: r.rowSpan,
    config: (r.config ?? {}) as Record<string, unknown>,
  }));
}

export async function saveWidgetsByUser(
  userId: string,
  widgets: WidgetConfigInput[],
): Promise<WidgetConfigInput[]> {
  await upsertUserWidgets(
    userId,
    widgets.map((w) => ({
      widgetId: w.widgetId,
      visible: w.visible,
      order: w.order,
      colSpan: w.colSpan,
      rowSpan: w.rowSpan,
      config: w.config ?? {},
    })),
  );
  return widgets;
}

// ─── Widget data dispatcher ──────────────────────────────────────────────────

const dateIntervalSchema = z.enum(['day', 'week', 'month', 'year', 'custom']);

export const widgetFilterConfigSchema = z
  .object({
    wallets: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    interval: dateIntervalSchema.default('month'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(5),
    budgetIds: z.array(z.string()).default([]),
  })
  .default({});

const PERIOD_WIDGETS = new Set([
  'income-vs-expense',
  'spending-by-category',
  'top-spending-categories',
  'biggest-expense',
  'daily-spending-rate',
]);

const ROLLING_WIDGETS = new Set(['monthly-cash-flow']);

function resolvePeriodRange(
  interval: DateInterval,
  startDate?: string,
  endDate?: string,
): { startDate: string; endDate: string } {
  if (interval === 'custom' && startDate && endDate) {
    return { startDate, endDate };
  }
  const now = dayjs().utc();
  switch (interval) {
    case 'day':
      return {
        startDate: now.startOf('day').toISOString(),
        endDate: now.endOf('day').toISOString(),
      };
    case 'week':
      return {
        startDate: now.startOf('week').toISOString(),
        endDate: now.endOf('week').toISOString(),
      };
    case 'month':
      return {
        startDate: now.startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
      };
    case 'year':
      return {
        startDate: now.startOf('year').toISOString(),
        endDate: now.endOf('year').toISOString(),
      };
    default:
      return {
        startDate: now.startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
      };
  }
}

function resolveRollingRange(
  interval: DateInterval,
  startDate?: string,
  endDate?: string,
): { startDate: string; endDate: string } {
  if (interval === 'custom' && startDate && endDate) {
    return { startDate, endDate };
  }
  const now = dayjs().utc();
  switch (interval) {
    case 'day':
      return {
        startDate: now.subtract(29, 'day').startOf('day').toISOString(),
        endDate: now.endOf('day').toISOString(),
      };
    case 'week':
      return {
        startDate: now.subtract(11, 'week').startOf('week').toISOString(),
        endDate: now.endOf('week').toISOString(),
      };
    case 'month':
      return {
        startDate: now.subtract(5, 'month').startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
      };
    case 'year':
      return {
        startDate: now.subtract(4, 'year').startOf('year').toISOString(),
        endDate: now.endOf('year').toISOString(),
      };
    default:
      return {
        startDate: now.subtract(5, 'month').startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
      };
  }
}

async function resolveCurrency(
  userId: string,
  walletIds: string[],
): Promise<string> {
  const filteredWallets = await getWalletsByUserIdWithBalance(
    userId,
    walletIds.length > 0 ? walletIds : undefined,
  );
  return filteredWallets[0]?.currency ?? 'USD';
}

export async function getWidgetData(
  userId: string,
  widgetId: string,
  rawConfig: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = widgetFilterConfigSchema.parse(rawConfig);

  // Wallet-only widgets
  if (
    widgetId === 'net-worth' ||
    widgetId === 'wallet-balance-breakdown' ||
    widgetId === 'balance-by-wallet'
  ) {
    const wallets = await getWalletsByUserIdWithBalance(
      userId,
      config.wallets,
    );
    return {
      wallets: wallets.map((w) => ({
        id: w.id,
        name: w.name,
        color: w.color ?? '#1f8a4c',
        currency: w.currency,
        balance: w.balance,
      })),
    };
  }

  // Budget progress
  if (widgetId === 'budget-progress') {
    const now = dayjs().utc();
    const result = await listBudgets(userId, now.format('YYYY-MM'));
    const filtered =
      config.budgetIds.length > 0
        ? result.budgets.filter((b) => config.budgetIds.includes(b.id))
        : result.budgets;
    const currency = await resolveCurrency(userId, config.wallets);
    return { budgets: filtered, currency };
  }

  // Recent transactions
  if (widgetId === 'recent-transactions') {
    const transactions = await getRecentTransactionsFiltered(
      userId,
      config.limit,
      config.wallets,
      config.categories,
    );
    const currency = await resolveCurrency(userId, config.wallets);
    return { transactions, currency };
  }

  // Period widgets
  if (PERIOD_WIDGETS.has(widgetId)) {
    const { startDate, endDate } = resolvePeriodRange(
      config.interval,
      config.startDate,
      config.endDate,
    );

    if (widgetId === 'income-vs-expense') {
      const result = await getIncomeVsExpense(
        userId,
        startDate,
        endDate,
        config.wallets,
        config.categories,
      );
      const currency = await resolveCurrency(userId, config.wallets);
      return { ...result, currency };
    }

    if (widgetId === 'spending-by-category' || widgetId === 'top-spending-categories') {
      const cats = await getSpendingByCategoryFiltered(
        userId,
        startDate,
        endDate,
        config.wallets,
        config.categories,
      );
      const currency = await resolveCurrency(userId, config.wallets);
      return { categories: cats, currency };
    }

    if (widgetId === 'biggest-expense') {
      const biggest = await getBiggestExpenseFiltered(
        userId,
        startDate,
        endDate,
        config.wallets,
        config.categories,
      );
      const currency = await resolveCurrency(userId, config.wallets);
      return { biggest, currency };
    }

    if (widgetId === 'daily-spending-rate') {
      const rate = await getDailySpendingRateFiltered(
        userId,
        startDate,
        endDate,
        config.wallets,
        config.categories,
      );
      const currency = await resolveCurrency(userId, config.wallets);
      return { rate, currency };
    }
  }

  // Rolling widget (monthly-cash-flow)
  if (ROLLING_WIDGETS.has(widgetId)) {
    const { startDate, endDate } = resolveRollingRange(
      config.interval,
      config.startDate,
      config.endDate,
    );
    const truncInterval =
      config.interval === 'custom' ? 'day' : config.interval;
    const rows = await getCashFlowByInterval(
      userId,
      truncInterval as 'day' | 'week' | 'month' | 'year',
      startDate,
      endDate,
      config.wallets,
      config.categories,
    );
    return {
      interval: config.interval,
      rows: rows.map((r) => ({
        period: r.period,
        income: r.income,
        expense: r.expense,
        net: r.net,
      })),
    };
  }

  throw new Error(`Unknown widget id: ${widgetId}`);
}
