import { apiClient } from './client';

export interface BudgetCategoryData {
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  limitAmount: string;
  spent: string;
  remaining: string;
  percentage: number;
}

export interface PeriodWindow {
  startDate: string;
  endDate: string;
}

export interface BudgetData {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  period: 'monthly' | 'yearly' | 'custom';
  periodWindow: PeriodWindow;
  totalAmount: string;
  spent: string;
  remaining: string;
  percentage: number;
  categories: BudgetCategoryData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetCategoryInput {
  categoryId: string;
  limitAmount: string;
}

export interface CreateBudgetInput {
  name: string;
  icon?: string;
  color?: string;
  period?: 'monthly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
  totalAmount: string;
  categories: CreateBudgetCategoryInput[];
}

export interface UpdateBudgetInput {
  name?: string;
  icon?: string;
  color?: string;
  period?: 'monthly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
  totalAmount?: string;
  categories?: CreateBudgetCategoryInput[];
}

export async function getBudget(
  id: string,
  period?: string,
): Promise<BudgetData> {
  const url = period ? `/budgets/${id}?period=${period}` : `/budgets/${id}`;
  const response = await apiClient.get<BudgetData>(url);
  return response.data;
}

export async function getBudgets(
  period?: string,
): Promise<{ budgets: BudgetData[] }> {
  const url = period ? `/budgets?period=${period}` : '/budgets';
  const response = await apiClient.get<{ budgets: BudgetData[] }>(url);
  return response.data;
}

export async function createBudget(
  input: CreateBudgetInput,
): Promise<BudgetData> {
  const response = await apiClient.post<BudgetData>('/budgets', input);
  return response.data;
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput,
): Promise<BudgetData> {
  const response = await apiClient.put<BudgetData>(`/budgets/${id}`, input);
  return response.data;
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
