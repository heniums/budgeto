import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';

export function IncomeVsExpenseWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();
  const thisMonth = summary?.thisMonth;

  // Use the first wallet's currency as default
  const currency =
    summary?.wallets?.[0]?.currency ?? 'USD';

  return (
    <WidgetCard loading={loading} error={error} title="Income vs Expense">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Income</p>
          <Money
            amount={thisMonth?.income ?? '0'}
            currency={currency}
            className="text-2xl font-bold text-green-600"
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Expense</p>
          <Money
            amount={thisMonth?.expense ?? '0'}
            currency={currency}
            className="text-2xl font-bold text-red-500"
          />
        </div>
      </div>
    </WidgetCard>
  );
}
