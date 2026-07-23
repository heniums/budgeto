import { findCategoryById } from '../categories/repository';
import {
  createBudgetCategory,
  deleteBudgetCategories,
  sumTransactionsByUserAndCategoryAndRange,
} from './repository';
import { resolveStoredDates } from './period';
import type { PeriodType } from './period';

async function buildCategoryResponse(
  userId: string,
  window: { startDate: string; endDate: string },
  category: { categoryId: string; limitAmount: string },
): Promise<BudgetCategoryResponse> {
  const categoryRow = await findCategoryById(category.categoryId);
  const spentRaw = await sumTransactionsByUserAndCategoryAndRange(
    userId,
    category.categoryId,
    window.startDate,
    window.endDate,
  );
  const spentAbs = Math.abs(Number(spentRaw)).toFixed(2);
  const remaining = Math.max(
    0,
    Number(category.limitAmount) - Number(spentAbs),
  ).toFixed(2);
  return {
    categoryId: category.categoryId,
    category: categoryRow
      ? {
          id: categoryRow.id,
          userId: categoryRow.userId,
          name: categoryRow.name,
          color: categoryRow.color,
          icon: categoryRow.icon,
          createdAt:
            categoryRow.createdAt instanceof Date
              ? categoryRow.createdAt.toISOString()
              : String(categoryRow.createdAt),
          updatedAt:
            categoryRow.updatedAt instanceof Date
              ? categoryRow.updatedAt.toISOString()
              : String(categoryRow.updatedAt),
        }
      : null,
    limitAmount: category.limitAmount,
    spent: spentAbs,
    remaining,
  };
}

async function buildBudgetResponseData(
  userId: string,
  period: string,
  startDate: string,
  endDate: string,
  totalAmount: string,
  categories: { categoryId: string; limitAmount: string }[],
  referenceDate?: Date,
): Promise<{
  periodWindow: { startDate: string; endDate: string };
  categoryResponses: BudgetCategoryResponse[];
  totalSpent: string;
  totalRemaining: string;
}> {
  const periodWindow = resolveStoredDates(
    period,
    startDate,
    endDate,
    referenceDate,
  );
  const categoryResponses = await Promise.all(
    categories.map((cat) => buildCategoryResponse(userId, periodWindow, cat)),
  );
  const totalSpent = categoryResponses
    .reduce((acc, c) => acc + Number(c.spent), 0)
    .toFixed(2);
  const totalRemaining = Math.max(
    0,
    Number(totalAmount) - Number(totalSpent),
  ).toFixed(2);
  return { periodWindow, categoryResponses, totalSpent, totalRemaining };
}

export async function applyCategoryChanges(
  budgetId: string,
  categories: { categoryId: string; limitAmount: string }[],
): Promise<void> {
  await deleteBudgetCategories(budgetId);
  for (const cat of categories) {
    await createBudgetCategory({
      budgetId,
      categoryId: cat.categoryId,
      limitAmount: cat.limitAmount,
    });
  }
}

interface BudgetResponseInput {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategoryResponse {
  categoryId: string;
  category: {
    id: string;
    userId: string;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  limitAmount: string;
  spent: string;
  remaining: string;
}

export interface BudgetResponse {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: 'spending' | 'saving';
  period: {
    type: PeriodType;
    window: {
      type: PeriodType;
      startDate: string;
      endDate: string;
    };
  };
  totalAmount: string;
  spent: string;
  remaining: string;
  categories: BudgetCategoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export async function formatBudgetResponse(
  budget: BudgetResponseInput,
  categories: { categoryId: string; limitAmount: string }[],
  referenceDate?: Date,
): Promise<BudgetResponse> {
  const { periodWindow, categoryResponses, totalSpent, totalRemaining } =
    await buildBudgetResponseData(
      budget.userId,
      budget.period,
      budget.startDate,
      budget.endDate,
      budget.totalAmount,
      categories,
      referenceDate,
    );
  const periodType = budget.period as PeriodType;
  return {
    id: budget.id,
    userId: budget.userId,
    name: budget.name,
    icon: budget.icon,
    color: budget.color,
    type: budget.type as 'spending' | 'saving',
    period: {
      type: periodType,
      window: {
        type: periodType,
        startDate: periodWindow.startDate,
        endDate: periodWindow.endDate,
      },
    },
    totalAmount: budget.totalAmount,
    spent: totalSpent,
    remaining: totalRemaining,
    categories: categoryResponses,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}
