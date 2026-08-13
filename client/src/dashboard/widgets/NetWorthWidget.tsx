import { useMemo } from 'react';
import { useWidgetData } from '../hooks/useWidgetData';
import { Money } from '@/components/Money';

export function NetWorthWidget(): JSX.Element {
  const { data } = useWidgetData('net-worth');

  const byCurrency = useMemo(() => {
    const wallets = data?.wallets ?? [];
    const map = new Map<string, number>();
    for (const w of wallets) {
      const balance = Number(w.balance) || 0;
      map.set(w.currency, (map.get(w.currency) || 0) + balance);
    }
    return map;
  }, [data?.wallets]);

  if (byCurrency.size === 0) {
    return <p className="text-sm text-muted-foreground">No wallets yet</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from(byCurrency.entries()).map(([currency, total]) => (
        <div key={currency} className="flex items-baseline gap-2">
          <Money
            amount={total.toFixed(2)}
            currency={currency}
            className="text-3xl font-black"
          />
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {currency}
          </span>
        </div>
      ))}
    </div>
  );
}
