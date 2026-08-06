import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';
import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';
import { CHART_COLORS } from '@/lib/chartTheme';

export function MonthlyCashFlowWidget(): JSX.Element {
  const { summary, loading, error } = useDashboardData();

  const chartData = useMemo(() => {
    if (!summary?.monthlyCashFlow) return null;
    const months = summary.monthlyCashFlow.slice(-6);
    return {
      labels: months.map((m) => dayjs(m.month).format('MMM YYYY')),
      datasets: [
        {
          label: 'Income',
          data: months.map((m) => Number(m.income) || 0),
          borderColor: CHART_COLORS.income,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Expense',
          data: months.map((m) => Number(m.expense) || 0),
          borderColor: CHART_COLORS.expense,
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Net',
          data: months.map((m) => Number(m.net) || 0),
          borderColor: CHART_COLORS.net,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, [summary?.monthlyCashFlow]);

  return (
    <WidgetCard loading={loading} error={error} title="Cash Flow">
      {chartData ? (
        <div className="h-full">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  grid: { color: CHART_COLORS.grid },
                  ticks: { color: CHART_COLORS.text },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: CHART_COLORS.grid },
                  ticks: { color: CHART_COLORS.text },
                },
              },
              plugins: {
                legend: {
                  position: 'bottom' as const,
                  labels: { color: CHART_COLORS.text },
                },
              },
            }}
          />
        </div>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">
            No cash flow data available
          </p>
        )
      )}
    </WidgetCard>
  );
}
