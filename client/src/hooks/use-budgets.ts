import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getBudgets, type BudgetData } from '../api/budgets';
import { BUDGETS_KEY } from '../lib/queryKeys';

export function useBudgetsQuery(
  period: string,
): UseQueryResult<BudgetData[], Error> {
  return useQuery({
    queryKey: [...BUDGETS_KEY, period],
    queryFn: () => getBudgets(period).then((r) => r.budgets),
  });
}
