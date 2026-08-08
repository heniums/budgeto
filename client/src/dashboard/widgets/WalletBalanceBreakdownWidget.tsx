import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { CHART_COLORS } from '@/lib/chartTheme';

export function WalletBalanceBreakdownWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('wallet-balance-breakdown');

  const chartData = useMemo(() => {
    const wallets = data?.wallets ?? [];
    if (wallets.length === 0) return null;
    return {
      labels: wallets.map((w) => w.name),
      datasets: [
        {
          data: wallets.map((w) => Number(w.balance) || 0),
          backgroundColor: wallets.map(
            (w) => w.color || CHART_COLORS.fallback[0],
          ),
          borderWidth: 0,
        },
      ],
    };
  }, [data?.wallets]);

  return (
    <WidgetCard loading={loading} error={error} title="Balance Breakdown">
      {chartData ? (
        <div className="h-full">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
              },
              cutout: '60%',
            }}
          />
        </div>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">No wallets yet</p>
        )
      )}
    </WidgetCard>
  );
}
