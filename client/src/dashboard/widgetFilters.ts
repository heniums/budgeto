import type { WidgetType, WidgetFilterConfig } from './types';

export type FilterField =
  | 'wallets'
  | 'categories'
  | 'interval'
  | 'customRange'
  | 'limit'
  | 'budgetIds';

export const DEFAULT_WIDGET_FILTERS: Record<WidgetType, WidgetFilterConfig> = {
  'net-worth': {},
  'income-vs-expense': { interval: 'month' },
  'monthly-cash-flow': { interval: 'month' },
  'spending-by-category': { interval: 'month' },
  'top-spending-categories': { interval: 'month' },
  'wallet-balance-breakdown': {},
  'balance-by-wallet': {},
  'budget-progress': {},
  'recent-transactions': { limit: 5 },
  'biggest-expense': { interval: 'month' },
  'daily-spending-rate': { interval: 'month' },
  'quick-shortcuts': {},
};

export const WIDGET_FILTER_FIELDS: Record<WidgetType, FilterField[]> = {
  'net-worth': ['wallets'],
  'income-vs-expense': ['wallets', 'categories', 'interval'],
  'monthly-cash-flow': ['wallets', 'categories', 'interval'],
  'spending-by-category': ['wallets', 'categories', 'interval'],
  'top-spending-categories': ['wallets', 'categories', 'interval'],
  'wallet-balance-breakdown': ['wallets'],
  'balance-by-wallet': ['wallets'],
  'budget-progress': ['budgetIds'],
  'recent-transactions': ['wallets', 'categories', 'limit'],
  'biggest-expense': ['wallets', 'categories', 'interval'],
  'daily-spending-rate': ['wallets', 'categories', 'interval'],
  'quick-shortcuts': [],
};
