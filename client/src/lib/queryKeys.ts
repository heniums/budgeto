/**
 * Central query-key registry for @tanstack/react-query. Every useQuery and
 * invalidateQueries call must use these literals/factories so invalidation
 * prefixes keep matching.
 */
export const WALLETS_KEY = ['wallets'] as const;
export const CATEGORIES_KEY = ['categories'] as const;
export const BUDGETS_KEY = ['budgets'] as const;
export const DASHBOARD_KEY = ['dashboard'] as const;
export const DASHBOARD_SUMMARY_KEY = ['dashboard', 'summary'] as const;
export const DASHBOARD_WIDGETS_KEY = ['dashboard', 'widgets'] as const;

export const widgetDataKey = (
  id: string,
  configKey: string,
): readonly [string, string, string, string] =>
  ['dashboard', 'widget-data', id, configKey] as const;
