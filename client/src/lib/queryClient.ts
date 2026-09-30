import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import {
  BUDGETS_KEY,
  CATEGORIES_KEY,
  DASHBOARD_KEY,
  TRANSACTIONS_KEY,
  WALLETS_KEY,
} from './queryKeys';

/**
 * App-wide query client. Tunables: staleTime gates background refetches on
 * navigation/focus; retry once before surfacing errors, except 401s — the
 * axios interceptor already handles those via silent refresh upstream, and a
 * retry would just duplicate the refresh/unauthorized cycle.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        count < 1 && !(error instanceof ApiError && error.status === 401),
    },
  },
});

/**
 * Invalidate every money-affected cache prefix on the given client. Call after
 * any mutation that can change balances, spending, or budget progress. No-op
 * for prefixes that are not currently cached.
 */
export function invalidateFinancialData(
  client: QueryClient,
): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: WALLETS_KEY }),
    client.invalidateQueries({ queryKey: CATEGORIES_KEY }),
    client.invalidateQueries({ queryKey: BUDGETS_KEY }),
    client.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
    client.invalidateQueries({ queryKey: DASHBOARD_KEY }),
  ]).then(() => undefined);
}
