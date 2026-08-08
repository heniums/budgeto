import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';

export function DailySpendingRateWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('daily-spending-rate');

  const rate = data?.rate;
  const currency = data?.currency ?? 'USD';

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
