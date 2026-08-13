import { useWidgetData } from '../hooks/useWidgetData';
import { Money } from '@/components/Money';

export function DailySpendingRateWidget(): JSX.Element {
  const { data } = useWidgetData('daily-spending-rate');

  const rate = data?.rate;
  const currency = data?.currency ?? 'USD';

  return (
    <div className="space-y-1">
      <Money
        amount={rate ?? '0'}
        currency={currency}
        className="text-4xl font-black"
      />
      <p className="text-sm text-muted-foreground">
        average daily spend this month
      </p>
    </div>
  );
}
