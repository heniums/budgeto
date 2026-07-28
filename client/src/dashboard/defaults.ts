import type { WidgetConfig } from './types';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'net-worth', visible: true, order: 0 },
  { id: 'monthly-cash-flow', visible: true, order: 1 },
  { id: 'income-vs-expense', visible: true, order: 2 },
  { id: 'spending-by-category', visible: true, order: 3 },
  { id: 'top-spending-categories', visible: true, order: 4 },
  { id: 'wallet-balance-breakdown', visible: true, order: 5 },
  { id: 'balance-by-wallet', visible: true, order: 6 },
  { id: 'budget-progress', visible: true, order: 7 },
  { id: 'recent-transactions', visible: true, order: 8 },
  { id: 'biggest-expense', visible: true, order: 9 },
  { id: 'daily-spending-rate', visible: true, order: 10 },
  { id: 'quick-shortcuts', visible: true, order: 11 },
];

export function getDefaultWidgets(): WidgetConfig[] {
  return DEFAULT_WIDGETS.map((w, index) => ({ ...w, order: index }));
}
