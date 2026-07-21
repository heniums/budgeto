import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';

function formatPeriodLabel(periodStr: string): string {
  const d = dayjs(periodStr + '-01');
  return d.format('MMMM YYYY');
}

function computePrevPeriod(periodStr: string): string {
  return dayjs(periodStr + '-01').subtract(1, 'month').format('YYYY-MM');
}

function computeNextPeriod(periodStr: string): string {
  return dayjs(periodStr + '-01').add(1, 'month').format('YYYY-MM');
}

interface BudgetPeriodNavProps {
  period: string;
  onChange: (period: string) => void;
}

export function BudgetPeriodNav({
  period,
  onChange,
}: BudgetPeriodNavProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        data-testid="period-nav-prev"
        onClick={() => onChange(computePrevPeriod(period))}
      >
        ← Prev
      </Button>
      <span
        data-testid="period-nav-label"
        className="text-sm font-medium min-w-[140px] text-center"
      >
        {formatPeriodLabel(period)}
      </span>
      <Button
        variant="outline"
        size="sm"
        data-testid="period-nav-next"
        onClick={() => onChange(computeNextPeriod(period))}
      >
        Next →
      </Button>
    </div>
  );
}
