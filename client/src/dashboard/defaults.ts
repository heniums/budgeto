import type { WidgetConfig } from './types';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'net-worth', visible: true, order: 0, colSpan: 1, rowSpan: 1 },
  { id: 'monthly-cash-flow', visible: true, order: 1, colSpan: 1, rowSpan: 2 },
  { id: 'income-vs-expense', visible: true, order: 2, colSpan: 1, rowSpan: 2 },
  {
    id: 'spending-by-category',
    visible: true,
    order: 3,
    colSpan: 1,
    rowSpan: 2,
  },
  {
    id: 'top-spending-categories',
    visible: true,
    order: 4,
    colSpan: 1,
    rowSpan: 2,
  },
  {
    id: 'wallet-balance-breakdown',
    visible: true,
    order: 5,
    colSpan: 1,
    rowSpan: 2,
  },
  { id: 'balance-by-wallet', visible: true, order: 6, colSpan: 1, rowSpan: 2 },
  { id: 'budget-progress', visible: true, order: 7, colSpan: 1, rowSpan: 2 },
  {
    id: 'recent-transactions',
    visible: true,
    order: 8,
    colSpan: 1,
    rowSpan: 2,
  },
  { id: 'biggest-expense', visible: true, order: 9, colSpan: 1, rowSpan: 1 },
  {
    id: 'daily-spending-rate',
    visible: true,
    order: 10,
    colSpan: 1,
    rowSpan: 1,
  },
  { id: 'quick-shortcuts', visible: true, order: 11, colSpan: 1, rowSpan: 1 },
];

export function getDefaultWidgets(): WidgetConfig[] {
  return DEFAULT_WIDGETS.map((w, index) => ({ ...w, order: index }));
}
