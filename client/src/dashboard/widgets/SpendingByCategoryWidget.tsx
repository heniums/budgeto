import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useWidgetData } from '../hooks/useWidgetData';
import { WidgetCard } from '../components/WidgetCard';
import { CHART_COLORS, OTHER_COLOR } from '@/lib/chartTheme';

export function SpendingByCategoryWidget(): JSX.Element {
  const { data, loading, error } = useWidgetData('spending-by-category');

  const chartData = useMemo(() => {
    const categories = data?.categories ?? [];
    if (categories.length === 0) return null;

    const sorted = [...categories].sort(
      (a, b) => Number(b.amount) - Number(a.amount),
    );
    const top8 = sorted.slice(0, 8);
    const rest = sorted.slice(8);

    const labels: string[] = top8.map((c) => c.name);
    const amounts: number[] = top8.map((c) => Number(c.amount) || 0);
    const colors: string[] = top8.map(
      (c, i) =>
        c.color || CHART_COLORS.fallback[i % CHART_COLORS.fallback.length],
    );

    if (rest.length > 0) {
      const otherTotal = rest.reduce(
        (sum, c) => sum + (Number(c.amount) || 0),
        0,
      );
      labels.push('Other');
      amounts.push(otherTotal);
      colors.push(OTHER_COLOR);
    }

    return {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  }, [data?.categories]);

  return (
    <WidgetCard loading={loading} error={error} title="Spending by Category">
      {chartData ? (
        <div className="h-full">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              cutout: '60%',
            }}
          />
        </div>
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
