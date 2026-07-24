import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createBudget,
  updateBudget,
  type BudgetData,
  type PeriodType,
} from '../api/budgets';
import type { CategoryData } from '../api/categories';
import { ApiError } from '../api/client';
import { ICONS } from '../lib/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from './MoneyInput';
import { ColorInput } from './ColorInput';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormError } from './FormError';
import { FormAlert } from './FormAlert';
import { CategoryBudgetField } from './CategoryBudgetField';
import type { CategoryBudgetFieldError } from './CategoryBudgetField';

const budgetSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    icon: z.string().min(1, 'Icon is required.'),
    color: z.string().min(1, 'Color is required.'),
    type: z.enum(['spending', 'saving']),
    period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
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
  )
  .refine(
    (data) => {
      const total = Number(data.totalAmount);
      if (isNaN(total)) return true;
      const sum = data.categories.reduce((acc, c) => {
        const limit = Number(c.limitAmount);
        return acc + (isNaN(limit) ? 0 : limit);
      }, 0);
      if (sum === 0) return true;
      return Math.abs(total - sum) < 0.01;
    },
    {
      message: 'Sum of category limits must equal the budget total.',
    },
  );

type BudgetValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  editingBudget: BudgetData | null;
  categories: CategoryData[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({
  editingBudget,
  categories,
  onSuccess,
  onCancel,
}: BudgetFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
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
      type: 'spending',
      totalAmount: '',
      categories: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  const selectedPeriod = watch('period');
  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  const usedCategoryIds = useMemo(
    () => new Set(fields.map((f) => f.categoryId).filter(Boolean)),
    [fields],
  );

  useEffect(() => {
    if (editingBudget) {
      reset({
        name: editingBudget.name,
        icon: editingBudget.icon,
        color: editingBudget.color,
        type: editingBudget.type,
        period: editingBudget.period.type,
        startDate: editingBudget.period.window.startDate,
        endDate: editingBudget.period.window.endDate,
        totalAmount: editingBudget.totalAmount,
        categories: editingBudget.categories.map((c) => ({
          categoryId: c.categoryId,
          limitAmount: c.limitAmount,
        })),
      });
    } else {
      reset({
        name: '',
        icon: 'wallet',
        color: '#1f8a4c',
        type: 'spending',
        period: 'monthly',
        startDate: '',
        endDate: '',
        totalAmount: '',
        categories: [],
      });
    }
    clearErrors('root');
  }, [editingBudget, reset]);

  const onSubmit = async (values: BudgetValues): Promise<void> => {
    clearErrors('root');
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          name: values.name,
          icon: values.icon,
          color: values.color,
          type: values.type,
          period: values.period as PeriodType,
          startDate: values.period === 'custom' ? values.startDate : undefined,
          endDate: values.period === 'custom' ? values.endDate : undefined,
          totalAmount: values.totalAmount,
          categories: values.categories,
        });
      } else {
        await createBudget({
          name: values.name,
          icon: values.icon,
          color: values.color,
          type: values.type,
          period: values.period as PeriodType,
          startDate: values.period === 'custom' ? values.startDate : undefined,
          endDate: values.period === 'custom' ? values.endDate : undefined,
          totalAmount: values.totalAmount,
          categories: values.categories,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Failed to save budget.' });
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
        <FormAlert message={errors.root?.message} />
        <div className="space-y-2">
          <Label htmlFor="budget-name">Name</Label>
          <Input id="budget-name" {...register('name')} />
          <FormError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" value="spending" {...register('type')} />
              Spending
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="saving" {...register('type')} />
              Saving
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <input type="hidden" {...register('icon')} />
          <div className="grid grid-cols-6 gap-1">
            {ICONS.map(({ name: iconName, Icon }) => (
              <button
                key={iconName}
                type="button"
                onClick={() =>
                  setValue('icon', iconName, { shouldDirty: true })
                }
                aria-label={iconName}
                className={cn(
                  'flex items-center justify-center p-2 rounded-md border-2',
                  selectedIcon === iconName
                    ? 'border-current'
                    : 'border-transparent hover:bg-muted',
                )}
                style={{
                  color:
                    selectedIcon === iconName ? selectedColor : undefined,
                }}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <FormError message={errors.icon?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget-color">Color</Label>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorInput
                id="budget-color"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FormError message={errors.color?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget-period">Period</Label>
          <select
            id="budget-period"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('period')}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
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
              <FormError message={errors.startDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-end">End date</Label>
              <Input
                id="budget-end"
                type="date"
                {...register('endDate')}
              />
              <FormError message={errors.endDate?.message} />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="budget-total">Total amount</Label>
          <Controller
            name="totalAmount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="budget-total"
                placeholder="1000.00"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FormError message={errors.totalAmount?.message} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ categoryId: '', limitAmount: '' })}
            >
              Add category
            </Button>
          </div>
          {fields.map((field, index) => (
            <CategoryBudgetField
              key={field.id}
              index={index}
              categoryId={watch(`categories.${index}.categoryId`) ?? ''}
              limitAmount={watch(`categories.${index}.limitAmount`) ?? ''}
              categories={categories}
              usedCategoryIds={usedCategoryIds}
              onCategoryChange={(value) =>
                setValue(`categories.${index}.categoryId`, value, {
                  shouldDirty: true,
                })
              }
              onLimitChange={(value) =>
                setValue(`categories.${index}.limitAmount`, value, {
                  shouldDirty: true,
                })
              }
              onRemove={() => remove(index)}
              error={
                (errors.categories?.[index] as CategoryBudgetFieldError | undefined) ??
                undefined
              }
            />
          ))}
          <FormError message={errors.categories?.message as string | undefined} />
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
