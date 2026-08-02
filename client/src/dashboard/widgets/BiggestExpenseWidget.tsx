import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';

export function BiggestExpenseWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();

  const biggest = summary?.thisMonth?.biggestExpense;
  const currency = summary?.wallets?.[0]?.currency ?? 'USD';

  return (
    <WidgetCard loading={loading} error={error} title="Biggest Expense">
      {biggest ? (
        <div className="space-y-1">
          <Money
            amount={biggest.amount}
            currency={currency}
            className="text-3xl font-bold text-red-500"
          />
          <p className="text-sm">
            {biggest.description || 'Unnamed transaction'}
          </p>
          <p className="text-xs text-muted-foreground">
            {biggest.categoryName ? `${biggest.categoryName}` : 'No category'}
          </p>
        </div>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">
            No expenses this month
          </p>
        )
      )}
    </WidgetCard>
  );
}
