import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';
import { CHART_COLORS } from '@/lib/chartTheme';

export function WalletBalanceBreakdownWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();

  const chartData = useMemo(() => {
    if (!summary?.wallets || summary.wallets.length === 0) return null;
    return {
      labels: summary.wallets.map((w) => w.name),
      datasets: [
        {
          data: summary.wallets.map((w) => Number(w.balance) || 0),
          backgroundColor: summary.wallets.map(
            (w) => w.color || CHART_COLORS.fallback[0],
          ),
          borderWidth: 0,
        },
      ],
    };
  }, [summary?.wallets]);

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
