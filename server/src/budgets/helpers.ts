import { findCategoryById } from '../categories/repository';
import {
  createBudgetCategory,
  deleteBudgetCategories,
  sumTransactionsByUserAndCategoryAndRange,
} from './repository';
import { resolveStoredDates } from './period';

const PERCENTAGE_CAP = 100;

function computePercentage(spent: string, total: string): number {
  const totalNum = Number(total);
  if (!totalNum) return 0;
  const raw = Math.min(PERCENTAGE_CAP, (Number(spent) / totalNum) * 100);
  return Math.round(raw * 100) / 100;
}

async function buildCategoryResponse(
  userId: string,
  window: { startDate: string; endDate: string },
  category: { categoryId: string; limitAmount: string },
): Promise<{
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  limitAmount: string;
  spent: string;
  remaining: string;
  percentage: number;
}> {
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
    categoryName: categoryRow?.name,
    categoryColor: categoryRow?.color,
    categoryIcon: categoryRow?.icon,
    limitAmount: category.limitAmount,
    spent: spentAbs,
    remaining,
    percentage: computePercentage(spentAbs, category.limitAmount),
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
  categoryResponses: Awaited<ReturnType<typeof buildCategoryResponse>>[];
  totalSpent: string;
  totalRemaining: string;
  percentage: number;
}> {
  const periodWindow = resolveStoredDates(
    period,
    startDate,
    endDate,
    referenceDate,
  );
  const categoryResponses = await Promise.all(
    categories.map((cat) =>
      buildCategoryResponse(userId, periodWindow, cat),
    ),
  );
  const totalSpent = categoryResponses
    .reduce((acc, c) => acc + Number(c.spent), 0)
    .toFixed(2);
  const totalRemaining = Math.max(
    0,
    Number(totalAmount) - Number(totalSpent),
  ).toFixed(2);
  const percentage = computePercentage(totalSpent, totalAmount);
  return { periodWindow, categoryResponses, totalSpent, totalRemaining, percentage };
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
  period: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategoryResponse {
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  limitAmount: string;
  spent: string;
  remaining: string;
  percentage: number;
}

export interface BudgetResponse {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  period: string;
  periodWindow: { startDate: string; endDate: string };
  totalAmount: string;
  spent: string;
  remaining: string;
  percentage: number;
  categories: BudgetCategoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export async function formatBudgetResponse(
  budget: BudgetResponseInput,
  categories: { categoryId: string; limitAmount: string }[],
  referenceDate?: Date,
): Promise<BudgetResponse> {
  const { periodWindow, categoryResponses, totalSpent, totalRemaining, percentage } =
    await buildBudgetResponseData(
      budget.userId,
      budget.period,
      budget.startDate,
      budget.endDate,
      budget.totalAmount,
      categories,
      referenceDate,
    );
  return {
    id: budget.id,
    userId: budget.userId,
    name: budget.name,
    icon: budget.icon,
    color: budget.color,
    period: budget.period,
    periodWindow,
    totalAmount: budget.totalAmount,
    spent: totalSpent,
    remaining: totalRemaining,
    percentage,
    categories: categoryResponses,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}
