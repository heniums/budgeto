import { z } from 'zod';
import {
  createCategory,
  findCategoriesByUserId,
  findCategoryById,
  updateCategory,
  deleteCategory,
} from './repository';
import { notFoundError } from '../errors';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(128),
  color: z
    .string()
    .regex(
      /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
      'Invalid color',
    ),
  icon: z.string().min(1).max(128),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(128).optional(),
  color: z
    .string()
    .regex(
      /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
      'Invalid color',
    )
    .optional(),
  icon: z.string().min(1).max(128).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryResponse {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function create(
  userId: string,
  input: CreateCategoryInput,
): Promise<CategoryResponse> {
  const category = await createCategory({
    userId,
    name: input.name,
    color: input.color,
    icon: input.icon,
  });
  return formatCategoryResponse(category);
}

export async function list(
  userId: string,
): Promise<{ categories: CategoryResponse[] }> {
  const rows = await findCategoriesByUserId(userId);
  return {
    categories: rows.map(formatCategoryResponse),
  };
}

export async function get(
  id: string,
  userId: string,
): Promise<CategoryResponse> {
  const category = await findCategoryById(id);
  if (!category) {
    throw notFoundError('Category not found');
  }
  if (category.userId !== userId) {
    throw notFoundError('Category not found');
  }
  return formatCategoryResponse(category);
}

export async function update(
  id: string,
  userId: string,
  input: UpdateCategoryInput,
): Promise<CategoryResponse> {
  const category = await findCategoryById(id);
  if (!category) {
    throw notFoundError('Category not found');
  }
  if (category.userId !== userId) {
    throw notFoundError('Category not found');
  }
  const updated = await updateCategory(id, input);
  if (!updated) {
    throw notFoundError('Category not found');
  }
  return formatCategoryResponse(updated);
}

export async function remove(id: string, userId: string): Promise<void> {
  const category = await findCategoryById(id);
  if (!category) {
    throw notFoundError('Category not found');
  }
  if (category.userId !== userId) {
    throw notFoundError('Category not found');
  }
  await deleteCategory(id);
}

function formatCategoryResponse(category: {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}): CategoryResponse {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
    icon: category.icon,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}
