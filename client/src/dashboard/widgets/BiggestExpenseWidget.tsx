import { useWidgetData } from '../hooks/useWidgetData';
import { Money } from '@/components/Money';

export function BiggestExpenseWidget(): JSX.Element | null {
  const { data, loading } = useWidgetData('biggest-expense');

  const biggest = data?.biggest;
  const currency = data?.currency ?? 'USD';

  if (!biggest) {
    return loading ? null : (
      <p className="text-sm text-muted-foreground">No expenses this month</p>
    );
  }

  return (
    <div className="space-y-1">
      <Money
        amount={biggest.amount}
        currency={currency}
        className="text-4xl font-black text-destructive"
      />
      <p className="text-sm">{biggest.description || 'Unnamed transaction'}</p>
    </div>
  );
}
