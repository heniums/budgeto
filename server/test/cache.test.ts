import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import { signToken } from '../src/auth/token';
import { deleteAllCategories } from '../src/categories/repository';
import { deleteAllWallets } from '../src/wallets/repository';
import { deleteAllTransactions } from '../src/transactions/repository';
import { clearCache, configureCache } from '../src/cache/cache';

// Cache is inert under NODE_ENV=test by default; this suite exists to prove
// the real HTTP behavior, so it opts in explicitly.
configureCache({ enabled: true });

const app = createApp();

describe('server cache (enabled)', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    await clearCache();
    await deleteAllTransactions();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    const { user } = await register({
      name: 'Cache Tester',
      email: 'cache@example.com',
      password: 'password123',
    });
    token = signToken({ sub: user.id, email: user.email, name: user.name });
    userId = user.id;
  });

  async function getSummary() {
    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    return response.body.summary as { recentTransactions: unknown[] };
  }

  async function createWallet(name: string): Promise<string> {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, currency: 'USD' });
    expect(response.status).toBe(201);
    return response.body.id;
  }

  async function createTransaction(
    walletId: string,
    amount: string,
    description: string,
  ): Promise<void> {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount, description });
    expect(response.status).toBe(201);
  }

  it('serves a mutation to the next read despite a cached summary', async () => {
    const walletId = await createWallet('Checking');

    const before = await getSummary();
    expect(before.recentTransactions).toHaveLength(0);

    await createTransaction(walletId, '42.00', 'Cache buster');

    const after = await getSummary();
    expect(after.recentTransactions).toHaveLength(1);
    expect(after.recentTransactions[0]).toMatchObject({
      description: 'Cache buster',
    });
  });

  it('returns a Date-shaped createdAt for wallets after caching', async () => {
    const walletId = await createWallet('Checking');

    const first = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(first.status).toBe(200);

    // Second read is served from the cache — the serialized value must
    // round-trip into the same JSON contract.
    const cached = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(cached.status).toBe(200);
    expect(cached.body.id).toBe(walletId);
    expect(typeof cached.body.createdAt).toBe('string');
    expect(cached.body.createdAt).toBe(first.body.createdAt);
  });

  it('does not leak cache entries between users', async () => {
    const walletId = await createWallet('Mine');
    const cached = await getSummary();

    const { user: otherUser } = await register({
      name: 'Other User',
      email: 'cache-other@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
      name: otherUser.name,
    });

    const other = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(other.status).toBe(200);
    expect(other.body.summary.wallets).toHaveLength(0);

    // Original user's cache is untouched
    const mine = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(mine.body.summary).toEqual(cached);
    expect(mine.body.summary.wallets).toHaveLength(1);
    expect(mine.body.summary.wallets[0].id).toBe(walletId);
    expect(userId).toBeDefined();
  });

  it('serves paginated transaction pages correctly despite caching', async () => {
    const walletId = await createWallet('Checking');
    for (let i = 1; i <= 3; i += 1) {
      await createTransaction(walletId, `${i}.00`, `Tx ${i}`);
    }

    async function getPage(offset: number) {
      const response = await request(app)
        .get('/transactions')
        .query({ limit: 2, offset })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      return response.body as { transactions: { description: string }[] };
    }

    const page1 = await getPage(0);
    expect(page1.transactions.map((t) => t.description)).toEqual([
      'Tx 3',
      'Tx 2',
    ]);

    // Page 2 must not be served page 1's cache entry.
    const page2 = await getPage(2);
    expect(page2.transactions.map((t) => t.description)).toEqual(['Tx 1']);

    // Cached pages stay stable on repeat reads.
    expect(await getPage(0)).toEqual(page1);
    expect(await getPage(2)).toEqual(page2);
  });

  it('shows a new transaction in the list and summary after mutation', async () => {
    const walletId = await createWallet('Checking');
    await createTransaction(walletId, '10.00', 'First');

    async function getList() {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      return response.body as {
        transactions: { description: string }[];
        total: number;
      };
    }

    async function getTxSummary() {
      const response = await request(app)
        .get('/transactions/summary')
        .query({ preset: 'month' })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      return response.body as {
        summary: { groups: { net: { amount: string }[] }[] };
      };
    }

    const listBefore = await getList();
    expect(listBefore.total).toBe(1);
    const summaryBefore = await getTxSummary();
    const netAmounts = summaryBefore.summary.groups.flatMap((g) =>
      g.net.map((n) => n.amount),
    );
    expect(netAmounts).toContain('10.00');

    await createTransaction(walletId, '5.00', 'Second');

    const listAfter = await getList();
    expect(listAfter.total).toBe(2);
    const summaryAfter = await getTxSummary();
    const afterAmounts = summaryAfter.summary.groups.flatMap((g) =>
      g.net.map((n) => n.amount),
    );
    expect(afterAmounts).toContain('15.00');
  });

  it('caches the categories list and invalidates on create', async () => {
    async function getCategories() {
      const response = await request(app)
        .get('/categories')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      return response.body as { categories: { name: string }[] };
    }

    const before = await getCategories();
    const initialCount = before.categories.length;

    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cached Cat', color: '#ff0000', icon: 'wallet' });
    expect(created.status).toBe(201);

    const after = await getCategories();
    expect(after.categories).toHaveLength(initialCount + 1);
    expect(after.categories.map((c) => c.name)).toContain('Cached Cat');
  });
});
