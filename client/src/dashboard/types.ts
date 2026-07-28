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

export interface WidgetConfig {
  id: WidgetType;
  visible: boolean;
  order: number;
}
