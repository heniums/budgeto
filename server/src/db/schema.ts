import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull().default(''),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wallets = pgTable('wallet', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  description: text('description').default(''),
  color: text('color').default('#1f8a4c'),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transactions = pgTable('transaction', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const categories = pgTable('category', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
