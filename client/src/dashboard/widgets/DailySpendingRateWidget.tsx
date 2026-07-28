import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';

export function DailySpendingRateWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();

  const rate = summary?.thisMonth?.dailySpendingRate;
  const currency = summary?.wallets?.[0]?.currency ?? 'USD';

  return (
    <WidgetCard loading={loading} error={error} title="Daily Spending">
      <div className="space-y-1">
        <Money
          amount={rate ?? '0'}
          currency={currency}
          className="text-3xl font-bold"
        />
        <p className="text-sm text-muted-foreground">
          average daily spend this month
        </p>
      </div>
    </WidgetCard>
  );
}
