import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createBudget,
  updateBudget,
  type BudgetData,
  type CreateBudgetCategoryInput,
} from '../api/budgets';
import type { CategoryData } from '../api/categories';
import { ApiError } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CategoryRow {
  categoryId: string;
  limitAmount: string;
}

const budgetSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    icon: z.string().min(1, 'Icon is required.'),
    color: z.string().min(1, 'Color is required.'),
    period: z.enum(['monthly', 'yearly', 'custom']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    totalAmount: z
      .string()
      .min(1, 'Total is required.')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
        message: 'Total must be a positive number.',
      }),
    categories: z
      .array(
        z.object({
          categoryId: z.string().uuid(),
          limitAmount: z
            .string()
            .min(1, 'Limit is required.')
            .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
              message: 'Limit must be a positive number.',
            }),
        }),
      )
      .min(1, 'Add at least one category.'),
  })
  .refine(
    (data) => {
      if (data.period !== 'custom') return true;
      return !!data.startDate && data.startDate.length > 0
        && !!data.endDate && data.endDate.length > 0;
    },
    {
      message: 'Start and end dates are required for custom periods.',
      path: ['startDate'],
    },
  );

type BudgetValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  editingBudget: BudgetData | null;
  expenseCategories: CategoryData[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({
  editingBudget,
  expenseCategories,
  onSuccess,
  onCancel,
}: BudgetFormProps): JSX.Element {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      icon: 'wallet',
      color: '#1f8a4c',
      period: 'monthly',
      startDate: '',
      endDate: '',
      totalAmount: '',
      categories: [],
    },
  });

  const selectedPeriod = watch('period');

  const usedCategoryIds = useMemo(
    () => new Set(rows.map((r) => r.categoryId).filter(Boolean)),
    [rows],
  );

  useEffect(() => {
    if (editingBudget) {
      setValue('name', editingBudget.name);
      setValue('icon', editingBudget.icon);
      setValue('color', editingBudget.color);
      setValue('period', editingBudget.period);
      setValue('startDate', editingBudget.periodWindow.startDate);
      setValue('endDate', editingBudget.periodWindow.endDate);
      setValue('totalAmount', editingBudget.totalAmount);
      setRows(
        editingBudget.categories.map((c) => ({
          categoryId: c.categoryId,
          limitAmount: c.limitAmount,
        })),
      );
    } else {
      reset();
      setRows([]);
    }
    setError(null);
  }, [editingBudget, setValue, reset]);

  const addRow = (): void => {
    setRows((prev) => [...prev, { categoryId: '', limitAmount: '' }]);
  };

  const updateRow = (
    index: number,
    field: keyof CategoryRow,
    value: string,
  ): void => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const removeRow = (index: number): void => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: BudgetValues): Promise<void> => {
    setError(null);
    try {
      const categoryInputs: CreateBudgetCategoryInput[] = rows.map((r) => ({
        categoryId: r.categoryId,
        limitAmount: r.limitAmount,
      }));
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          name: values.name,
          icon: values.icon,
          color: values.color,
          period: values.period,
          startDate: values.period === 'custom' ? values.startDate : undefined,
          endDate: values.period === 'custom' ? values.endDate : undefined,
          totalAmount: values.totalAmount,
          categories: categoryInputs,
        });
      } else {
        await createBudget({
          name: values.name,
          icon: values.icon,
          color: values.color,
          period: values.period,
          startDate: values.period === 'custom' ? values.startDate : undefined,
          endDate: values.period === 'custom' ? values.endDate : undefined,
          totalAmount: values.totalAmount,
          categories: categoryInputs,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save budget.');
      }
    }
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingBudget ? 'Edit budget' : 'Add budget'}
        </DialogTitle>
      </DialogHeader>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="budget-name">Name</Label>
          <Input id="budget-name" {...register('name')} />
          {errors.name && (
            <span role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="flex gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget-icon">Icon</Label>
            <Input id="budget-icon" {...register('icon')} />
            {errors.icon && (
              <span role="alert" className="text-sm text-destructive">
                {errors.icon.message}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-color">Color</Label>
            <Input
              id="budget-color"
              type="color"
              {...register('color')}
            />
            {errors.color && (
              <span role="alert" className="text-sm text-destructive">
                {errors.color.message}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget-period">Period</Label>
          <select
            id="budget-period"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('period')}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {selectedPeriod === 'custom' && (
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-start">Start date</Label>
              <Input
                id="budget-start"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.startDate.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-end">End date</Label>
              <Input
                id="budget-end"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.endDate.message}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="budget-total">Total amount</Label>
          <Input
            id="budget-total"
            type="text"
            inputMode="decimal"
            placeholder="1000.00"
            {...register('totalAmount')}
          />
          {errors.totalAmount && (
            <span role="alert" className="text-sm text-destructive">
              {errors.totalAmount.message}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
            >
              Add category
            </Button>
          </div>
          {rows.map((row, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <select
                  aria-label={`Category ${index + 1}`}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={row.categoryId}
                  onChange={(e) =>
                    updateRow(index, 'categoryId', e.target.value)
                  }
                >
                  <option value="">Select category</option>
                  {expenseCategories
                    .filter(
                      (c) =>
                        !usedCategoryIds.has(c.id) ||
                        c.id === row.categoryId,
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="w-32 space-y-1">
                <Input
                  aria-label={`Limit ${index + 1}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="Limit"
                  value={row.limitAmount}
                  onChange={(e) =>
                    updateRow(index, 'limitAmount', e.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(index)}
              >
                ✕
              </Button>
            </div>
          ))}
          {errors.categories && (
            <span role="alert" className="text-sm text-destructive">
              {errors.categories.message as string}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? editingBudget
                ? 'Saving…'
                : 'Adding…'
              : editingBudget
                ? 'Save changes'
                : 'Add budget'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
