export type WidgetType =
  | 'net-worth'
  | 'monthly-cash-flow'
  | 'income-vs-expense'
  | 'spending-by-category'
  | 'top-spending-categories'
  | 'wallet-balance-breakdown'
  | 'balance-by-wallet'
  | 'budget-progress'
  | 'recent-transactions'
  | 'biggest-expense'
  | 'daily-spending-rate'
  | 'quick-shortcuts';

export type DateInterval = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface WidgetFilterConfig {
  wallets?: string[];
  categories?: string[];
  interval?: DateInterval;
  startDate?: string;
  endDate?: string;
  limit?: number;
  budgetIds?: string[];
}

export interface WidgetConfig {
  id: WidgetType;
  visible: boolean;
  order: number;
  colSpan: number;
  rowSpan: number;
  config: WidgetFilterConfig;
}
