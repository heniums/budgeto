import { apiClient } from './client';
import type { BudgetData } from './budgets';

export interface WidgetConfigInput {
  widgetId: string;
  visible: boolean;
  order: number;
  colSpan: number;
  rowSpan: number;
}

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
  budgets: BudgetData[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<{ summary: DashboardSummary }>(
    '/dashboard/summary',
  );
  return response.data.summary;
}

export async function getWidgets(): Promise<WidgetConfigInput[]> {
  const response = await apiClient.get<{ widgets: WidgetConfigInput[] }>(
    '/dashboard/widgets',
  );
  return response.data.widgets;
}

export async function saveWidgets(
  widgets: WidgetConfigInput[],
): Promise<WidgetConfigInput[]> {
  const response = await apiClient.post<{ widgets: WidgetConfigInput[] }>(
    '/dashboard/widgets',
    { widgets },
  );
  return response.data.widgets;
}
