import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import dayjs from 'dayjs';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import {
  deleteAllUsers,
} from '../src/auth/repository';
import { signToken } from '../src/auth/token';
import { deleteAllCategories } from '../src/categories/repository';
import { deleteAllWallets } from '../src/wallets/repository';
import { deleteAllBudgets } from '../src/budgets/repository';
import { deleteAllTransactions } from '../src/transactions/repository';
import { db } from '../src/db/client';
import { userWidgets } from '../src/db/schema';

const app = createApp();

async function createTestUser(
  name = 'Dashboard Tester',
  email = 'dashboard@example.com',
): Promise<{ token: string; userId: string }> {
  const { user } = await register({
    name,
    email,
    password: 'password123',
  });
  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  return { token, userId: user.id };
}

async function createCategory(
  token: string,
  name: string,
): Promise<{ id: string }> {
  const response = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, color: '#FF5733', icon: 'shopping-cart' });
  expect(response.status).toBe(201);
  return response.body;
}

async function createWallet(
  token: string,
  name: string,
  currency = 'USD',
): Promise<{ id: string }> {
  const response = await request(app)
    .post('/wallets')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, currency });
  expect(response.status).toBe(201);
  return response.body;
}

async function createTransactionViaApi(
  token: string,
  walletId: string,
  amount: string,
  description: string,
  categoryId?: string,
): Promise<void> {
  const payload: Record<string, string> = { amount, description };
  if (categoryId) payload.categoryId = categoryId;
  const response = await request(app)
    .post(`/wallets/${walletId}/transactions`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  expect(response.status).toBe(201);
}

describe('GET /dashboard/widgets', () => {
  let token: string;

  beforeEach(async () => {
    await db.delete(userWidgets);
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    ({ token } = await createTestUser());
  });

  it('returns an empty array for a fresh user', async () => {
    const response = await request(app)
      .get('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.widgets).toEqual([]);
  });

  it('returns saved widgets after POST', async () => {
    const widgets = [
      { widgetId: 'net-worth', visible: true, order: 0 },
      { widgetId: 'monthly-cash-flow', visible: false, order: 1 },
      { widgetId: 'budget-progress', visible: true, order: 2 },
    ];
    const saveResponse = await request(app)
      .post('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ widgets });
    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.widgets).toEqual(widgets);

    const listResponse = await request(app)
      .get('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.widgets).toEqual(widgets);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app).get('/dashboard/widgets');
    expect(response.status).toBe(401);
  });
});

describe('POST /dashboard/widgets', () => {
  let token: string;

  beforeEach(async () => {
    await db.delete(userWidgets);
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    ({ token } = await createTestUser());
  });

  it('persists widget config and returns it (200)', async () => {
    const widgets = [
      { widgetId: 'net-worth', visible: true, order: 0 },
      { widgetId: 'recent-transactions', visible: false, order: 1 },
    ];
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ widgets });
    expect(response.status).toBe(200);
    expect(response.body.widgets).toEqual(widgets);
  });

  it('rejects negative order (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        widgets: [
          { widgetId: 'net-worth', visible: true, order: -1 },
        ],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing widgetId (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        widgets: [{ visible: true, order: 0 }],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty widgetId (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        widgets: [{ widgetId: '', visible: true, order: 0 }],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .send({ widgets: [] });
    expect(response.status).toBe(401);
  });
});

describe('GET /dashboard/summary', () => {
  let token: string;

  beforeEach(async () => {
    await db.delete(userWidgets);
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    ({ token } = await createTestUser());
  });

  it('returns zero totals for a user with no transactions', async () => {
    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    const { summary } = response.body;
    expect(summary.period).toBeDefined();
    expect(summary.period.month).toBe(dayjs().format('YYYY-MM'));
    expect(summary.wallets).toEqual([]);
    expect(summary.monthlyCashFlow).toBeDefined();
    expect(Number(summary.thisMonth.income)).toBe(0);
    expect(Number(summary.thisMonth.expense)).toBe(0);
    expect(Number(summary.thisMonth.net)).toBe(0);
    expect(summary.spendingByCategory).toEqual([]);
    expect(summary.recentTransactions).toEqual([]);
    expect(summary.budgets).toEqual([]);
  });

  it('returns correct shape with seeded data', async () => {
    const wallet = await createWallet(token, 'Checking');
    const category = await createCategory(token, 'Food');

    // Seed an income transaction
    await createTransactionViaApi(
      token,
      wallet.id,
      '1000.00',
      'Salary',
    );
    // Seed an expense transaction
    await createTransactionViaApi(
      token,
      wallet.id,
      '-50.00',
      'Groceries',
      category.id,
    );

    // Create a budget
    const today = dayjs();
    const budgetResponse = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Food Budget',
        icon: 'utensils',
        color: '#ff0000',
        type: 'spending',
        period: 'monthly',
        totalAmount: '500.00',
        categories: [
          { categoryId: category.id, limitAmount: '500.00' },
        ],
      });
    expect(budgetResponse.status).toBe(201);

    const response = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);

    const { summary } = response.body;

    // Wallets
    expect(summary.wallets).toHaveLength(1);
    expect(summary.wallets[0].name).toBe('Checking');
    expect(summary.wallets[0].currency).toBe('USD');

    // This month income/expense
    expect(Number(summary.thisMonth.income)).toBeGreaterThan(0);
    expect(Number(summary.thisMonth.expense)).toBeGreaterThan(0);

    // Spending by category
    expect(summary.spendingByCategory.length).toBeGreaterThanOrEqual(1);

    // Recent transactions
    expect(summary.recentTransactions.length).toBeGreaterThanOrEqual(1);

    // Budgets
    expect(summary.budgets.length).toBeGreaterThanOrEqual(1);
    expect(summary.budgets[0].name).toBe('Food Budget');

    // Period
    expect(summary.period.month).toBe(today.format('YYYY-MM'));
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app).get('/dashboard/summary');
    expect(response.status).toBe(401);
  });
});
