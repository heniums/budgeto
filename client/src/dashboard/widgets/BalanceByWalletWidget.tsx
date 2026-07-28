import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';

export function BalanceByWalletWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();

  const chartData = useMemo(() => {
    if (!summary?.wallets || summary.wallets.length === 0) return null;
    return {
      labels: summary.wallets.map((w) => w.name),
      datasets: [
        {
          data: summary.wallets.map((w) => Number(w.balance) || 0),
          backgroundColor: summary.wallets.map(
            (w) => w.color || '#6366f1',
          ),
          borderRadius: 4,
        },
      ],
    };
  }, [summary?.wallets]);

  return (
    <WidgetCard loading={loading} error={error} title="Balance by Wallet">
      {chartData ? (
        <div className="h-60">
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
