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
} from './repository';

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
}

export async function getWidgetsByUser(
  userId: string,
): Promise<WidgetConfigInput[]> {
  const rows = await findWidgetsByUserId(userId);
  return rows.map((r) => ({
    widgetId: r.widgetId,
    visible: r.visible,
    order: r.order,
  }));
}

export async function saveWidgetsByUser(
  userId: string,
  widgets: WidgetConfigInput[],
): Promise<WidgetConfigInput[]> {
  await upsertUserWidgets(userId, widgets);
  return widgets;
}
