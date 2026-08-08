import type { DashboardSummary } from '@/api/dashboard';
import type { BudgetData } from '@/api/budgets';
import type {
  DateInterval,
  WidgetFilterConfig,
  WidgetType,
} from './types';
import { DEFAULT_WIDGET_FILTERS, normalizeFilterConfig } from './widgetFilters';

type WalletSummary = {
  id: string;
  name: string;
  color: string;
  currency: string;
  balance: string;
};

type CategorySpendingRow = {
  categoryId: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  amount: string;
};

type RecentTransactionRow = {
  id: string;
  description: string;
  amount: string;
  date: string;
  categoryName: string | null;
  walletName: string;
};

type BiggestExpenseRow = {
  id: string;
  description: string | null;
  amount: string;
  date: string;
  categoryName: string | null;
};

type CashFlowRow = {
  period: string;
  income: string;
  expense: string;
  net: string;
};

export type WidgetDataMap = {
  'net-worth': { wallets: WalletSummary[] };
  'income-vs-expense': {
    income: string;
    expense: string;
    net: string;
    currency: string;
  };
  'monthly-cash-flow': { interval: DateInterval; rows: CashFlowRow[] };
  'spending-by-category': { categories: CategorySpendingRow[]; currency: string };
  'top-spending-categories': { categories: CategorySpendingRow[]; currency: string };
  'wallet-balance-breakdown': { wallets: WalletSummary[] };
  'balance-by-wallet': { wallets: WalletSummary[] };
  'budget-progress': { budgets: BudgetData[]; currency: string };
  'recent-transactions': {
    transactions: RecentTransactionRow[];
    currency: string;
  };
  'biggest-expense': { biggest: BiggestExpenseRow | null; currency: string };
  'daily-spending-rate': { rate: string; currency: string };
  'quick-shortcuts': never;
};

function isDefaultConfig(
  widgetId: WidgetType,
  config: WidgetFilterConfig,
): boolean {
  const defaults = DEFAULT_WIDGET_FILTERS[widgetId];
  return (
    JSON.stringify(normalizeFilterConfig(config)) ===
    JSON.stringify(normalizeFilterConfig(defaults))
  );
}

export function defaultDataForWidget<T extends WidgetType>(
  id: T,
  summary: DashboardSummary,
  config: WidgetFilterConfig,
): WidgetDataMap[T] | null {
  if (!isDefaultConfig(id, config)) return null;
  if (!summary) return null;

  const currency = summary.wallets?.[0]?.currency ?? 'USD';

  switch (id) {
    case 'net-worth':
      return { wallets: summary.wallets } as WidgetDataMap[T];
    case 'wallet-balance-breakdown':
    case 'balance-by-wallet':
      return { wallets: summary.wallets } as WidgetDataMap[T];
    case 'income-vs-expense':
      return {
        income: summary.thisMonth.income,
        expense: summary.thisMonth.expense,
        net: summary.thisMonth.net,
        currency,
      } as WidgetDataMap[T];
    case 'monthly-cash-flow':
      return {
        interval: 'month',
        rows: summary.monthlyCashFlow.map((r) => ({
          period: r.month,
          income: r.income,
          expense: r.expense,
          net: r.net,
        })),
      } as WidgetDataMap[T];
    case 'spending-by-category':
    case 'top-spending-categories':
      return { categories: summary.spendingByCategory, currency } as WidgetDataMap[T];
    case 'budget-progress':
      return { budgets: summary.budgets, currency } as WidgetDataMap[T];
    case 'recent-transactions':
      return {
        transactions: summary.recentTransactions.slice(
          0,
          config.limit ?? 5,
        ),
        currency,
      } as WidgetDataMap[T];
    case 'biggest-expense':
      return {
        biggest: summary.thisMonth.biggestExpense,
        currency,
      } as WidgetDataMap[T];
    case 'daily-spending-rate':
      return {
        rate: summary.thisMonth.dailySpendingRate,
        currency,
      } as WidgetDataMap[T];
    case 'quick-shortcuts':
      return null;
    default:
      return null;
  }
}
