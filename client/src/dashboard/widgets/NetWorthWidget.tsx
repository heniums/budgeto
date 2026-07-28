import { useMemo } from 'react';
import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';
import { Money } from '@/components/Money';

export function NetWorthWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();

  const byCurrency = useMemo(() => {
    if (!summary?.wallets) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const w of summary.wallets) {
      const balance = Number(w.balance) || 0;
      map.set(w.currency, (map.get(w.currency) || 0) + balance);
    }
    return map;
  }, [summary?.wallets]);

  return (
    <WidgetCard loading={loading} error={error} title="Net Worth">
      <div className="flex flex-col gap-2">
        {Array.from(byCurrency.entries()).map(([currency, total]) => (
          <div key={currency} className="flex items-baseline gap-2">
            <Money
              amount={total.toFixed(2)}
              currency={currency}
              className="text-2xl font-bold"
            />
            <span className="text-xs text-muted-foreground uppercase">
              {currency}
            </span>
          </div>
        ))}
        {byCurrency.size === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No wallets yet</p>
        )}
      </div>
    </WidgetCard>
  );
}
