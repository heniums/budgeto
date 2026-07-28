import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Wallet,
  TrendingUp,
  ArrowRightLeft,
  PieChart,
  List,
  BarChart3,
  Target,
  DollarSign,
  Calendar,
  Zap,
} from 'lucide-react';
import type { WidgetType } from './types';
import { NetWorthWidget } from './widgets/NetWorthWidget';
import { MonthlyCashFlowWidget } from './widgets/MonthlyCashFlowWidget';
import { IncomeVsExpenseWidget } from './widgets/IncomeVsExpenseWidget';
import { SpendingByCategoryWidget } from './widgets/SpendingByCategoryWidget';
import { TopSpendingCategoriesWidget } from './widgets/TopSpendingCategoriesWidget';
import { WalletBalanceBreakdownWidget } from './widgets/WalletBalanceBreakdownWidget';
import { BalanceByWalletWidget } from './widgets/BalanceByWalletWidget';
import { BudgetProgressWidget } from './widgets/BudgetProgressWidget';
import { RecentTransactionsWidget } from './widgets/RecentTransactionsWidget';
import { BiggestExpenseWidget } from './widgets/BiggestExpenseWidget';
import { DailySpendingRateWidget } from './widgets/DailySpendingRateWidget';
import { QuickShortcutsWidget } from './widgets/QuickShortcutsWidget';

export interface WidgetMeta {
  id: WidgetType;
  title: string;
  icon: LucideIcon;
  component: ComponentType;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  'net-worth': {
    id: 'net-worth',
    title: 'Net Worth',
    icon: Wallet,
    component: NetWorthWidget,
  },
  'monthly-cash-flow': {
    id: 'monthly-cash-flow',
    title: 'Cash Flow',
    icon: TrendingUp,
    component: MonthlyCashFlowWidget,
  },
  'income-vs-expense': {
    id: 'income-vs-expense',
    title: 'Income vs Expense',
    icon: ArrowRightLeft,
    component: IncomeVsExpenseWidget,
  },
  'spending-by-category': {
    id: 'spending-by-category',
    title: 'Spending by Category',
    icon: PieChart,
    component: SpendingByCategoryWidget,
  },
  'top-spending-categories': {
    id: 'top-spending-categories',
    title: 'Top Categories',
    icon: List,
    component: TopSpendingCategoriesWidget,
  },
  'wallet-balance-breakdown': {
    id: 'wallet-balance-breakdown',
    title: 'Balance Breakdown',
    icon: PieChart,
    component: WalletBalanceBreakdownWidget,
  },
  'balance-by-wallet': {
    id: 'balance-by-wallet',
    title: 'Balance by Wallet',
    icon: BarChart3,
    component: BalanceByWalletWidget,
  },
  'budget-progress': {
    id: 'budget-progress',
    title: 'Budget Progress',
    icon: Target,
    component: BudgetProgressWidget,
  },
  'recent-transactions': {
    id: 'recent-transactions',
    title: 'Recent Transactions',
    icon: List,
    component: RecentTransactionsWidget,
  },
  'biggest-expense': {
    id: 'biggest-expense',
    title: 'Biggest Expense',
    icon: DollarSign,
    component: BiggestExpenseWidget,
  },
  'daily-spending-rate': {
    id: 'daily-spending-rate',
    title: 'Daily Spending',
    icon: Calendar,
    component: DailySpendingRateWidget,
  },
  'quick-shortcuts': {
    id: 'quick-shortcuts',
    title: 'Quick Actions',
    icon: Zap,
    component: QuickShortcutsWidget,
  },
};
