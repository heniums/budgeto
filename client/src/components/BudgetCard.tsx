import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Money } from './Money';
import type { BudgetData } from '../api/budgets';

interface BudgetCardProps {
  budget: BudgetData;
  onEdit: (budget: BudgetData) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: BudgetCardProps): JSX.Element {
  return (
    <div
      key={budget.id}
      className="rounded-md border p-4 space-y-3"
      data-testid="budget-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: budget.color }}
          >
            {budget.icon}
          </span>
          <div>
            <h2 className="font-semibold">{budget.name}</h2>
            <p className="text-xs text-muted-foreground">
              {budget.period} ·{' '}
              {dayjs(budget.periodWindow.startDate).format('MMM D')}
              {' – '}
              {dayjs(budget.periodWindow.endDate).format('MMM D, YYYY')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(budget)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(budget.id)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Progress value={budget.percentage} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            <Money amount={budget.spent} currency="USD" /> /{' '}
            <Money amount={budget.totalAmount} currency="USD" />
          </span>
          <span>
            <Money amount={budget.remaining} currency="USD" /> left (
            {budget.percentage}%)
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {budget.categories.map((cat) => (
          <div key={cat.categoryId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{cat.categoryName}</span>
              <span className="text-xs text-muted-foreground">
                {cat.percentage}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <Money amount={cat.spent} currency="USD" /> /{' '}
                <Money amount={cat.limitAmount} currency="USD" />
              </span>
              <span className="text-xs text-muted-foreground">
                <Money amount={cat.remaining} currency="USD" /> left
              </span>
            </div>
            <Progress value={cat.percentage} />
          </div>
        ))}
      </div>
    </div>
  );
}
