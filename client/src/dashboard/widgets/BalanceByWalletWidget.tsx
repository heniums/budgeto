import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { CHART_COLORS } from '@/lib/chartTheme';

export function BalanceByWalletWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('balance-by-wallet');

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
          borderRadius: 4,
        },
      ],
    };
  }, [data?.wallets]);

  return (
    <WidgetCard loading={loading} error={error} title="Balance by Wallet">
      {chartData ? (
        <div className="h-full">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
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
