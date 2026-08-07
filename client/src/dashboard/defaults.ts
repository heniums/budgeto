import type { WidgetConfig } from './types';
import { DEFAULT_WIDGET_FILTERS } from './widgetFilters';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'net-worth', visible: true, order: 0, colSpan: 1, rowSpan: 1, config: DEFAULT_WIDGET_FILTERS['net-worth'] },
  { id: 'monthly-cash-flow', visible: true, order: 1, colSpan: 1, rowSpan: 2, config: DEFAULT_WIDGET_FILTERS['monthly-cash-flow'] },
  { id: 'income-vs-expense', visible: true, order: 2, colSpan: 1, rowSpan: 2, config: DEFAULT_WIDGET_FILTERS['income-vs-expense'] },
  {
    id: 'spending-by-category',
    visible: true,
    order: 3,
    colSpan: 1,
    rowSpan: 2,
    config: DEFAULT_WIDGET_FILTERS['spending-by-category'],
  },
  {
    id: 'top-spending-categories',
    visible: true,
    order: 4,
    colSpan: 1,
    rowSpan: 2,
    config: DEFAULT_WIDGET_FILTERS['top-spending-categories'],
  },
  {
    id: 'wallet-balance-breakdown',
    visible: true,
    order: 5,
    colSpan: 1,
    rowSpan: 2,
    config: DEFAULT_WIDGET_FILTERS['wallet-balance-breakdown'],
  },
  { id: 'balance-by-wallet', visible: true, order: 6, colSpan: 1, rowSpan: 2, config: DEFAULT_WIDGET_FILTERS['balance-by-wallet'] },
  { id: 'budget-progress', visible: true, order: 7, colSpan: 1, rowSpan: 2, config: DEFAULT_WIDGET_FILTERS['budget-progress'] },
  {
    id: 'recent-transactions',
    visible: true,
    order: 8,
    colSpan: 1,
    rowSpan: 2,
    config: DEFAULT_WIDGET_FILTERS['recent-transactions'],
  },
  { id: 'biggest-expense', visible: true, order: 9, colSpan: 1, rowSpan: 1, config: DEFAULT_WIDGET_FILTERS['biggest-expense'] },
  {
    id: 'daily-spending-rate',
    visible: true,
    order: 10,
    colSpan: 1,
    rowSpan: 1,
    config: DEFAULT_WIDGET_FILTERS['daily-spending-rate'],
  },
  { id: 'quick-shortcuts', visible: true, order: 11, colSpan: 1, rowSpan: 1, config: DEFAULT_WIDGET_FILTERS['quick-shortcuts'] },
];

export function getDefaultWidgets(): WidgetConfig[] {
  return DEFAULT_WIDGETS.map((w, index) => ({ ...w, order: index }));
}
