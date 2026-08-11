import { useWidgetData } from '../hooks/useWidgetData';
import { Money } from '@/components/Money';

export function IncomeVsExpenseWidget(): JSX.Element {
  const { data } = useWidgetData('income-vs-expense');

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Income</p>
        <Money
          amount={data?.income ?? '0'}
          currency={data?.currency ?? 'USD'}
          className="text-2xl font-bold text-primary"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Expense</p>
        <Money
          amount={data?.expense ?? '0'}
          currency={data?.currency ?? 'USD'}
          className="text-2xl font-bold text-destructive"
        />
      </div>
    </div>
  );
}
