import { z } from 'zod';
import {
  createBudget,
  createBudgetCategory,
  findBudgetsByUserId,
  findBudgetById,
  findBudgetCategories,
  updateBudget,
  deleteBudget,
} from './repository';
import { findCategoryById } from '../categories/repository';
import { notFoundError, validationError } from '../errors';
import { resolveStoredDates, resolveUpdateDates, parsePeriodReference } from './period';
import { formatBudgetResponse, applyCategoryChanges } from './helpers';
import type { BudgetResponse } from './helpers';
import dayjs from 'dayjs';

function isNumericString(val: string): boolean {
  return Number.isFinite(Number(val));
}

const categoryLimitSchema = z.object({
  categoryId: z.string().uuid(),
  limitAmount: z
    .string()
    .refine((val) => isNumericString(val) && Number(val) > 0, {
      message: 'Limit must be a positive number',
    }),
});

export const createBudgetSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    icon: z.string().min(1).default('wallet'),
    color: z.string().min(1).default('#1f8a4c'),
    period: z.enum(['monthly', 'yearly', 'weekly', 'daily', 'custom']).default('monthly'),
    startDate: z.string().date('Invalid start date').optional(),
    endDate: z.string().date('Invalid end date').optional(),
    totalAmount: z
      .string()
      .refine((val) => isNumericString(val) && Number(val) > 0, {
        message: 'Total amount must be a positive number',
      }),
    categories: z
      .array(categoryLimitSchema)
      .min(1, 'At least one category is required'),
  })
  .refine(
    (data) => {
      if (data.period !== 'custom') return true;
      return !!data.startDate && !!data.endDate;
    },
    {
      message: 'Start date and end date are required for custom periods',
      path: ['startDate'],
    },
  );

export const updateBudgetSchema = z
  .object({
    name: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    period: z.enum(['monthly', 'yearly', 'weekly', 'daily', 'custom']).optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    totalAmount: z
      .string()
      .refine((val) => isNumericString(val) && Number(val) > 0, {
        message: 'Total amount must be a positive number',
      })
      .optional(),
    categories: z.array(categoryLimitSchema).min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.period !== 'custom') return true;
      if (!data.startDate && !data.endDate) return true;
      return !!data.startDate && !!data.endDate;
    },
    {
      message: 'Start date and end date must both be provided for custom periods',
      path: ['startDate'],
    },
  );

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export type { BudgetCategoryResponse, BudgetResponse } from './helpers';

export interface PeriodWindowResponse {
  startDate: string;
  endDate: string;
}

async function validateCategories(
  userId: string,
  categories: { categoryId: string; limitAmount: string }[],
  totalAmount: string,
): Promise<void> {
  let sum = 0;
  for (const cat of categories) {
    const category = await findCategoryById(cat.categoryId);
    if (!category || category.userId !== userId) {
      throw notFoundError(`Category ${cat.categoryId} not found`);
    }
    if (category.type !== 'expense') {
      throw validationError('Budgets can only include expense categories');
    }
    sum += Number(cat.limitAmount);
  }
  if (sum > Number(totalAmount)) {
    throw validationError(
      'Sum of category limits cannot exceed the budget total',
    );
  }
}

export async function create(
  userId: string,
  input: CreateBudgetInput,
): Promise<BudgetResponse> {
  await validateCategories(userId, input.categories, input.totalAmount);

  const storedDates = resolveStoredDates(
    input.period,
    input.startDate,
    input.endDate,
  );

  const budget = await createBudget({
    userId,
    name: input.name,
    icon: input.icon,
    color: input.color,
    period: input.period,
    startDate: storedDates.startDate,
    endDate: storedDates.endDate,
    totalAmount: input.totalAmount,
  });

  for (const cat of input.categories) {
    await createBudgetCategory({
      budgetId: budget.id,
      categoryId: cat.categoryId,
      limitAmount: cat.limitAmount,
    });
  }

  const limitMap = input.categories.map((c) => ({
    categoryId: c.categoryId,
    limitAmount: c.limitAmount,
  }));
  return formatBudgetResponse(
    {
      ...budget,
      startDate: dayjs(budget.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(budget.endDate).format('YYYY-MM-DD'),
    },
    limitMap,
  );
}

export async function list(
  userId: string,
  periodParam?: string,
): Promise<{ budgets: BudgetResponse[] }> {
  const rows = await findBudgetsByUserId(userId);
  const referenceDate = periodParam
    ? parsePeriodReference(periodParam)
    : undefined;
  const budgets: BudgetResponse[] = [];
  for (const row of rows) {
    const categories = await findBudgetCategories(row.id);
    const limitMap = categories.map((c) => ({
      categoryId: c.categoryId,
      limitAmount: c.limitAmount,
    }));
    budgets.push(
      await formatBudgetResponse(
        {
          ...row,
          startDate: dayjs(row.startDate).format('YYYY-MM-DD'),
          endDate: dayjs(row.endDate).format('YYYY-MM-DD'),
        },
        limitMap,
        referenceDate,
      ),
    );
  }
  return { budgets };
}

export async function get(
  id: string,
  userId: string,
  periodParam?: string,
): Promise<BudgetResponse> {
  const budget = await findBudgetById(id);
  if (!budget || budget.userId !== userId) {
    throw notFoundError('Budget not found');
  }
  const categories = await findBudgetCategories(budget.id);
  const limitMap = categories.map((c) => ({
    categoryId: c.categoryId,
    limitAmount: c.limitAmount,
  }));
  const referenceDate = periodParam
    ? parsePeriodReference(periodParam)
    : undefined;
  return formatBudgetResponse(
    {
      ...budget,
      startDate: dayjs(budget.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(budget.endDate).format('YYYY-MM-DD'),
    },
    limitMap,
    referenceDate,
  );
}

export async function update(
  id: string,
  userId: string,
  input: UpdateBudgetInput,
): Promise<BudgetResponse> {
  const existing = await findBudgetById(id);
  if (!existing || existing.userId !== userId) {
    throw notFoundError('Budget not found');
  }

  const totalAmount = input.totalAmount ?? existing.totalAmount;
  const categories =
    input.categories ??
    (await findBudgetCategories(existing.id)).map((c) => ({
      categoryId: c.categoryId,
      limitAmount: c.limitAmount,
    }));

  if (input.categories) {
    await validateCategories(userId, categories, totalAmount);
  } else if (
    Number(totalAmount) <
    categories.reduce((a, c) => a + Number(c.limitAmount), 0)
  ) {
    throw validationError(
      'Budget total cannot be lower than the sum of category limits',
    );
  }

  const storedDates = resolveUpdateDates(
    input.period,
    input.startDate,
    input.endDate,
    existing.period,
    dayjs(existing.startDate).format('YYYY-MM-DD'),
    dayjs(existing.endDate).format('YYYY-MM-DD'),
  );

  const updated = await updateBudget(id, {
    name: input.name,
    icon: input.icon,
    color: input.color,
    period: input.period,
    startDate: input.period || input.startDate ? storedDates.startDate : undefined,
    endDate: input.period || input.endDate ? storedDates.endDate : undefined,
    totalAmount: input.totalAmount,
  });
  if (!updated) {
    throw notFoundError('Budget not found');
  }

  if (input.categories) {
    await applyCategoryChanges(existing.id, input.categories);
  }

  const finalCategories = await findBudgetCategories(existing.id);
  const limitMap = finalCategories.map((c) => ({
    categoryId: c.categoryId,
    limitAmount: c.limitAmount,
  }));
  return formatBudgetResponse(
    {
      ...updated,
      startDate: dayjs(updated.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(updated.endDate).format('YYYY-MM-DD'),
    },
    limitMap,
  );
}

export async function remove(id: string, userId: string): Promise<void> {
  const budget = await findBudgetById(id);
  if (!budget || budget.userId !== userId) {
    throw notFoundError('Budget not found');
  }
  await deleteBudget(id);
}
