import { useWidgetData } from '../hooks/useWidgetData';
import { ProgressListSkeleton } from '../components/WidgetSkeletons';
import { Money } from '@/components/Money';
import { Progress } from '@/components/ui/progress';

export function BudgetProgressWidget(): JSX.Element {
  const { data, loading } = useWidgetData('budget-progress');

  const budgets = data?.budgets ?? [];
  const currency = data?.currency ?? 'USD';

  if (budgets.length === 0) {
    return loading ? (
      <ProgressListSkeleton rows={3} />
    ) : (
      <p className="text-sm text-muted-foreground">No budgets yet</p>
    );
  }

  return (
    <ul className="space-y-4">
      {budgets.map((b) => {
        const total = Number(b.totalAmount) || 0;
        const spent = Number(b.spent) || 0;
        const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
        const over = spent > total;
        return (
          <li key={b.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{b.name}</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Money
                  amount={b.spent}
                  currency={currency}
                  className={over ? 'text-destructive' : undefined}
                />
                <span>/</span>
                <Money
                  amount={b.totalAmount}
                  currency={currency}
                  className={over ? 'text-destructive' : undefined}
                />
              </div>
            </div>
            <Progress
              value={pct}
              indicatorClassName={over ? 'bg-destructive' : undefined}
            />
          </li>
        );
      })}
    </ul>
  );
}
