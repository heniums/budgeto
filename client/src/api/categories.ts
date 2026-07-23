import { apiClient } from './client';

export interface CategoryData {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryData> {
  const response = await apiClient.post<CategoryData>('/categories', input);
  return response.data;
}

export async function getCategories(): Promise<{
  categories: CategoryData[];
}> {
  const response =
    await apiClient.get<{ categories: CategoryData[] }>('/categories');
  return response.data;
}

export async function getCategory(id: string): Promise<CategoryData> {
  const response = await apiClient.get<CategoryData>(`/categories/${id}`);
  return response.data;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryData> {
  const response = await apiClient.put<CategoryData>(
    `/categories/${id}`,
    input,
  );
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
