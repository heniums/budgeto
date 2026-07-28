import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';
import { useDashboardData } from '../DashboardDataProvider';
import { WidgetCard } from '../components/WidgetCard';

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
          borderColor: '#1f8a4c',
          backgroundColor: 'rgba(31, 138, 76, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Expense',
          data: months.map((m) => Number(m.expense) || 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Net',
          data: months.map((m) => Number(m.net) || 0),
          borderColor: '#2f6fed',
          backgroundColor: 'rgba(47, 111, 237, 0.1)',
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
              plugins: {
                legend: { position: 'bottom' },
              },
              scales: {
                y: {
                  beginAtZero: true,
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
