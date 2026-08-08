import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';
import { Progress } from '@/components/ui/progress';

export function BudgetProgressWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('budget-progress');

  const budgets = data?.budgets ?? [];
  const currency = data?.currency ?? 'USD';

  return (
    <WidgetCard loading={loading} error={error} title="Budget Progress">
      {budgets.length > 0 ? (
        <ul className="space-y-4">
          {budgets.map((b) => {
            const total = Number(b.totalAmount) || 0;
            const spent = Number(b.spent) || 0;
            const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
            return (
              <li key={b.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{b.name}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Money amount={b.spent} currency={currency} />
                    <span>/</span>
                    <Money amount={b.totalAmount} currency={currency} />
                  </div>
                </div>
                <Progress value={pct} />
              </li>
            );
          })}
        </ul>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">No budgets yet</p>
        )
      )}
    </WidgetCard>
  );
}
