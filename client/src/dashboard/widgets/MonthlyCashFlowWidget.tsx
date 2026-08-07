import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { CHART_COLORS } from '@/lib/chartTheme';
import { formatPeriodLabel } from '@/lib/dateRange';
import type { DateInterval } from '../types';

export function MonthlyCashFlowWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('monthly-cash-flow');

  const chartData = useMemo(() => {
    if (!data?.rows?.length) return null;
    const interval = data.interval as DateInterval;
    return {
      labels: data.rows.map((r) => formatPeriodLabel(r.period, interval)),
      datasets: [
        {
          label: 'Income',
          data: data.rows.map((r) => Number(r.income) || 0),
          borderColor: CHART_COLORS.income,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Expense',
          data: data.rows.map((r) => Number(r.expense) || 0),
          borderColor: CHART_COLORS.expense,
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Net',
          data: data.rows.map((r) => Number(r.net) || 0),
          borderColor: CHART_COLORS.net,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, [data]);

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
