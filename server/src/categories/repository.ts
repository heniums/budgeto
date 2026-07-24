import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { categories, type Category, type NewCategory } from '../db/schema';

export async function createCategory(
  input: NewCategory,
): Promise<Category> {
  const [category] = await db.insert(categories).values(input).returning();
  return category;
}

export async function findCategoriesByUserId(
  userId: string,
): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.createdAt);
}

export async function findCategoryById(
  id: string,
): Promise<Category | undefined> {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  return category;
}

export async function findCategoryByUserIdAndName(
  userId: string,
  name: string,
): Promise<Category | undefined> {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name)));
  return category;
}

export async function updateCategory(
  id: string,
  input: Partial<Pick<NewCategory, 'name' | 'color' | 'icon'>>,
): Promise<Category | undefined> {
  const [category] = await db
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();
  return category;
}

export async function deleteCategory(
  id: string,
): Promise<Category | undefined> {
  const [category] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();
  return category;
}

export async function deleteAllCategories(): Promise<void> {
  await db.delete(categories);
}

export type { Category };
