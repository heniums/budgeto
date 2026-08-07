import { useMemo } from 'react';
import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';
import { CHART_COLORS } from '@/lib/chartTheme';

export function TopSpendingCategoriesWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('top-spending-categories');

  const currency = data?.currency ?? 'USD';

  const top5 = useMemo(() => {
    const categories = data?.categories ?? [];
    if (categories.length === 0) return [];
    const total = categories.reduce(
      (sum, c) => sum + (Number(c.amount) || 0),
      0,
    );
    const sorted = [...categories]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
    return sorted.map((c) => ({
      name: c.name,
      amount: c.amount,
      color: c.color,
      pct: total > 0 ? ((Number(c.amount) || 0) / total) * 100 : 0,
    }));
  }, [data?.categories]);

  return (
    <WidgetCard loading={loading} error={error} title="Top Categories">
      {top5.length > 0 ? (
        <ul className="space-y-3">
          {top5.map((c) => (
            <li key={c.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: c.color ?? CHART_COLORS.fallback[0],
                  }}
                />
                <span className="text-sm">{c.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {c.pct.toFixed(0)}%
                </span>
                <Money
                  amount={c.amount}
                  currency={currency}
                  className="text-sm font-medium"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">
            No spending data available
          </p>
        )
      )}
    </WidgetCard>
  );
}
