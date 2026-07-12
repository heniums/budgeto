import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users, type User } from '../db/schema';

/**
 * Data-access functions for the `user` table, backed by the shared Drizzle
 * database instance.
 */
export async function createUser(input: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name ?? '',
    })
    .returning();
  return user;
}

export async function updateUserName(
  id: string,
  name: string,
): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({ name, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function updateUserPasswordHash(
  id: string,
  passwordHash: string,
): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  return user;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));
  return user;
}

export async function deleteAllUsers(): Promise<void> {
  await db.delete(users);
}

export type { User };
