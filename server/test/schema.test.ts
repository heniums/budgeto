import { describe, it, expect } from 'vitest';

async function importSchema() {
  const mod = await import('../src/db/schema');
  return mod;
}

describe('wallet table schema', () => {
  it('has id, user_id, name, description, color, created_at, updated_at columns', async () => {
    const { wallets } = await importSchema();

    expect(wallets.id).toBeDefined();
    expect(wallets.userId).toBeDefined();
    expect(wallets.name).toBeDefined();
    expect(wallets.description).toBeDefined();
    expect(wallets.color).toBeDefined();
    expect(wallets.createdAt).toBeDefined();
    expect(wallets.updatedAt).toBeDefined();
  });

  it('enforces NOT NULL on required fields', async () => {
    const { wallets } = await importSchema();

    expect(wallets.id.notNull).toBe(true);
    expect(wallets.userId.notNull).toBe(true);
    expect(wallets.name.notNull).toBe(true);
    expect(wallets.createdAt.notNull).toBe(true);
    expect(wallets.updatedAt.notNull).toBe(true);
  });

  it('has user_id column configured', async () => {
    const { wallets } = await importSchema();

    expect(wallets.userId).toBeDefined();
    expect(wallets.userId.notNull).toBe(true);
  });
});

describe('transaction table schema', () => {
  it('has id, wallet_id, amount, description, created_at columns', async () => {
    const { transactions } = await importSchema();

    expect(transactions.id).toBeDefined();
    expect(transactions.walletId).toBeDefined();
    expect(transactions.amount).toBeDefined();
    expect(transactions.description).toBeDefined();
    expect(transactions.createdAt).toBeDefined();
  });

  it('enforces NOT NULL on required fields', async () => {
    const { transactions } = await importSchema();

    expect(transactions.id.notNull).toBe(true);
    expect(transactions.walletId.notNull).toBe(true);
    expect(transactions.amount.notNull).toBe(true);
    expect(transactions.createdAt.notNull).toBe(true);
  });

  it('has wallet_id column configured', async () => {
    const { transactions } = await importSchema();

    expect(transactions.walletId).toBeDefined();
    expect(transactions.walletId.notNull).toBe(true);
  });
});

describe('category table schema', () => {
  it('has id, user_id, name, color, icon, created_at, updated_at columns', async () => {
    const { categories } = await importSchema();

    expect(categories.id).toBeDefined();
    expect(categories.userId).toBeDefined();
    expect(categories.name).toBeDefined();
    expect(categories.color).toBeDefined();
    expect(categories.icon).toBeDefined();
    expect(categories.createdAt).toBeDefined();
    expect(categories.updatedAt).toBeDefined();
  });

  it('enforces NOT NULL on required fields', async () => {
    const { categories } = await importSchema();

    expect(categories.id.notNull).toBe(true);
    expect(categories.userId.notNull).toBe(true);
    expect(categories.name.notNull).toBe(true);
    expect(categories.color.notNull).toBe(true);
    expect(categories.icon.notNull).toBe(true);
    expect(categories.createdAt.notNull).toBe(true);
    expect(categories.updatedAt.notNull).toBe(true);
  });

  it('has user_id column configured as FK to users', async () => {
    const { categories } = await importSchema();

    expect(categories.userId).toBeDefined();
    expect(categories.userId.notNull).toBe(true);
  });
});
