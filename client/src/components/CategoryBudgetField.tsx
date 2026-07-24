import type { CategoryData } from '../api/categories';
import { Button } from '@/components/ui/button';
import { MoneyInput } from './MoneyInput';
import { FormError } from './FormError';

export interface CategoryBudgetFieldError {
  categoryId?: { message?: string };
  limitAmount?: { message?: string };
}

interface CategoryBudgetFieldProps {
  index: number;
  categoryId: string;
  limitAmount: string;
  categories: CategoryData[];
  usedCategoryIds: Set<string>;
  onCategoryChange: (value: string) => void;
  onLimitChange: (value: string) => void;
  onRemove: () => void;
  error?: CategoryBudgetFieldError;
}

export function CategoryBudgetField({
  index,
  categoryId,
  limitAmount,
  categories,
  usedCategoryIds,
  onCategoryChange,
  onLimitChange,
  onRemove,
  error,
}: CategoryBudgetFieldProps): JSX.Element {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <select
          aria-label={`Category ${index + 1}`}
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select category</option>
          {categories
            .filter(
              (c) => !usedCategoryIds.has(c.id) || c.id === categoryId,
            )
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
        <FormError message={error?.categoryId?.message} />
      </div>
      <div className="w-32 space-y-1">
        <MoneyInput
          aria-label={`Limit ${index + 1}`}
          value={limitAmount}
          onChange={onLimitChange}
        />
        <FormError message={error?.limitAmount?.message} />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
      >
        ✕
      </Button>
    </div>
  );
}
