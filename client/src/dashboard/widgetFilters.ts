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

export function normalizeFilterConfig(
  config: WidgetFilterConfig,
): WidgetFilterConfig {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0),
    ),
  ) as WidgetFilterConfig;
}

export const WIDGET_FILTER_FIELDS: Record<WidgetType, FilterField[]> = {
  'net-worth': ['wallets'],
  'income-vs-expense': ['wallets', 'categories', 'interval', 'customRange'],
  'monthly-cash-flow': ['wallets', 'categories', 'interval', 'customRange'],
  'spending-by-category': ['wallets', 'categories', 'interval', 'customRange'],
  'top-spending-categories': ['wallets', 'categories', 'interval', 'customRange'],
  'wallet-balance-breakdown': ['wallets'],
  'balance-by-wallet': ['wallets'],
  'budget-progress': ['budgetIds'],
  'recent-transactions': ['wallets', 'categories', 'limit'],
  'biggest-expense': ['wallets', 'categories', 'interval', 'customRange'],
  'daily-spending-rate': ['wallets', 'categories', 'interval', 'customRange'],
  'quick-shortcuts': [],
};
