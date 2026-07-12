import { eq } from 'drizzle-orm';
import { db as defaultDb } from '../db/client';
import { users, type User } from '../db/schema';

/**
 * Data-access layer for the `user` table. Accepts a Drizzle database instance
 * so it can be exercised against a test database.
 */
export class UserRepository {
  constructor(private readonly db = defaultDb) {}

  async create(input: { email: string; passwordHash: string }): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({ email: input.email, passwordHash: input.passwordHash })
      .returning();
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async deleteAll(): Promise<void> {
    await this.db.delete(users);
  }
}

export const userRepository = new UserRepository();
export type { User };
