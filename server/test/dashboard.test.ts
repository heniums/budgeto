import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import dayjs from 'dayjs';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import { signToken } from '../src/auth/token';
import { deleteAllCategories } from '../src/categories/repository';
import { deleteAllWallets } from '../src/wallets/repository';
import { deleteAllBudgets } from '../src/budgets/repository';
import { deleteAllTransactions } from '../src/transactions/repository';
import { db } from '../src/db/client';
import { userWidgets } from '../src/db/schema';

import { ACCESS_COOKIE_NAME } from '../src/auth/cookies';

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
    .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
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
    .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
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
  date?: string,
): Promise<void> {
  const payload: Record<string, string> = { amount, description };
  if (categoryId) payload.categoryId = categoryId;
  if (date) payload.date = date;
  const response = await request(app)
    .post(`/wallets/${walletId}/transactions`)
    .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
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
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`]);
    expect(response.status).toBe(200);
    expect(response.body.widgets).toEqual([]);
  });

  it('returns saved widgets after POST', async () => {
    const widgets = [
      {
        widgetId: 'net-worth',
        visible: true,
        order: 0,
        colSpan: 1,
        rowSpan: 2,
        config: {},
      },
      {
        widgetId: 'monthly-cash-flow',
        visible: false,
        order: 1,
        colSpan: 1,
        rowSpan: 2,
        config: {},
      },
      {
        widgetId: 'budget-progress',
        visible: true,
        order: 2,
        colSpan: 1,
        rowSpan: 2,
        config: {},
      },
    ];
    const saveResponse = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ widgets });
    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.widgets).toEqual(widgets);

    const listResponse = await request(app)
      .get('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`]);
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
      {
        widgetId: 'net-worth',
        visible: true,
        order: 0,
        colSpan: 1,
        rowSpan: 2,
        config: {},
      },
      {
        widgetId: 'recent-transactions',
        visible: false,
        order: 1,
        colSpan: 1,
        rowSpan: 2,
        config: {},
      },
    ];
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ widgets });
    expect(response.status).toBe(200);
    expect(response.body.widgets).toEqual(widgets);
  });

  it('rejects negative order (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        widgets: [{ widgetId: 'net-worth', visible: true, order: -1 }],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing widgetId (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        widgets: [{ visible: true, order: 0 }],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty widgetId (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        widgets: [{ widgetId: '', visible: true, order: 0 }],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects colSpan > 2 (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        widgets: [
          {
            widgetId: 'net-worth',
            visible: true,
            order: 0,
            colSpan: 3,
            rowSpan: 1,
          },
        ],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects rowSpan < 1 (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        widgets: [
          {
            widgetId: 'net-worth',
            visible: true,
            order: 0,
            colSpan: 1,
            rowSpan: 0,
          },
        ],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects colSpan as float (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        widgets: [
          {
            widgetId: 'net-worth',
            visible: true,
            order: 0,
            colSpan: 1.5,
            rowSpan: 1,
          },
        ],
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
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`]);
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
    await createTransactionViaApi(token, wallet.id, '1000.00', 'Salary');
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
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        name: 'Food Budget',
        icon: 'utensils',
        color: '#ff0000',
        type: 'spending',
        period: 'monthly',
        totalAmount: '500.00',
        categories: [{ categoryId: category.id, limitAmount: '500.00' }],
      });
    expect(budgetResponse.status).toBe(201);

    const response = await request(app)
      .get('/dashboard/summary')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`]);
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
describe('POST /dashboard/widgets/:widgetId/data', () => {
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

  it('returns filtered income-vs-expense totals', async () => {
    const wallet1 = await createWallet(token, 'Checking');
    const wallet2 = await createWallet(token, 'Savings');
    const cat1 = await createCategory(token, 'Food');
    const cat2 = await createCategory(token, 'Transport');

    // Seed income on wallet1
    await createTransactionViaApi(token, wallet1.id, '2000.00', 'Salary');
    // Seed expenses
    await createTransactionViaApi(
      token,
      wallet1.id,
      '-100.00',
      'Groceries',
      cat1.id,
    );
    await createTransactionViaApi(
      token,
      wallet2.id,
      '-50.00',
      'Bus',
      cat2.id,
    );

    // Filter to wallet1 only (income transaction has no category, so skip category filter)
    const response = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        config: {
          wallets: [wallet1.id],
          interval: 'month',
        },
      });
    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(Number(data.income)).toBe(2000);
    expect(Number(data.expense)).toBe(100);
    expect(Number(data.net)).toBe(1900);
    expect(data.currency).toBe('USD');
  });

  it('returns grouped monthly-cash-flow data', async () => {
    const wallet = await createWallet(token, 'Checking');
    await createTransactionViaApi(token, wallet.id, '1000.00', 'Salary');
    await createTransactionViaApi(token, wallet.id, '-200.00', 'Rent');

    const response = await request(app)
      .post('/dashboard/widgets/monthly-cash-flow/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        config: {
          interval: 'month',
        },
      });
    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(data.interval).toBe('month');
    expect(Array.isArray(data.rows)).toBe(true);
    expect(data.rows.length).toBeGreaterThanOrEqual(1);
    const row = data.rows[data.rows.length - 1];
    expect(Number(row.income)).toBe(1000);
    expect(Number(row.expense)).toBe(200);
    expect(Number(row.net)).toBe(800);
  });

  it('rejects invalid widget id (404)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets/nonexistent/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: {} });
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('returns empty data for quick-shortcuts', async () => {
    const response = await request(app)
      .post('/dashboard/widgets/quick-shortcuts/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: {} });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({});
  });

  it('category filter excludes uncategorized transactions', async () => {
    const wallet = await createWallet(token, 'Checking');
    const cat1 = await createCategory(token, 'Food');
    await createTransactionViaApi(
      token,
      wallet.id,
      '-100.00',
      'Groceries',
      cat1.id,
    );
    await createTransactionViaApi(token, wallet.id, '-50.00', 'Misc');

    const response = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        config: {
          wallets: [wallet.id],
          categories: [cat1.id],
        },
      });
    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(Number(data.income)).toBe(0);
    expect(Number(data.expense)).toBe(100);
    expect(Number(data.net)).toBe(-100);
  });

  it('empty selection returns all data', async () => {
    const wallet1 = await createWallet(token, 'Checking');
    const wallet2 = await createWallet(token, 'Savings');
    await createTransactionViaApi(token, wallet1.id, '1000.00', 'Salary');
    await createTransactionViaApi(token, wallet2.id, '500.00', 'Bonus');

    const defaultConfig = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: {} });
    expect(defaultConfig.status).toBe(200);
    expect(Number(defaultConfig.body.data.income)).toBe(1500);

    const emptyArrays = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: { wallets: [], categories: [] } });
    expect(emptyArrays.status).toBe(200);
    expect(Number(emptyArrays.body.data.income)).toBe(1500);
  });

  it('groups custom interval by day', async () => {
    const wallet = await createWallet(token, 'Checking');
    const day1 = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const day2 = dayjs().format('YYYY-MM-DD');
    await createTransactionViaApi(
      token,
      wallet.id,
      '1000.00',
      'Salary',
      undefined,
      `${day1}T12:00:00.000Z`,
    );
    await createTransactionViaApi(
      token,
      wallet.id,
      '-200.00',
      'Rent',
      undefined,
      `${day1}T12:00:00.000Z`,
    );
    await createTransactionViaApi(
      token,
      wallet.id,
      '500.00',
      'Bonus',
      undefined,
      `${day2}T12:00:00.000Z`,
    );
    await createTransactionViaApi(
      token,
      wallet.id,
      '-50.00',
      'Coffee',
      undefined,
      `${day2}T12:00:00.000Z`,
    );

    const response = await request(app)
      .post('/dashboard/widgets/monthly-cash-flow/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({
        config: {
          interval: 'custom',
          startDate: day1,
          endDate: day2,
        },
      });
    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(data.interval).toBe('custom');
    expect(data.rows.length).toBeGreaterThanOrEqual(2);
    const day1Row = data.rows.find((r: { period: string }) =>
      r.period.startsWith(day1),
    );
    const day2Row = data.rows.find((r: { period: string }) =>
      r.period.startsWith(day2),
    );
    expect(day1Row).toBeDefined();
    expect(day2Row).toBeDefined();
    expect(Number(day1Row.income)).toBe(1000);
    expect(Number(day1Row.expense)).toBe(200);
    expect(Number(day2Row.income)).toBe(500);
    expect(Number(day2Row.expense)).toBe(50);
  });

  it('rejects malformed config (400)', async () => {
    const badInterval = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: { interval: 'hour' } });
    expect(badInterval.status).toBe(400);
    expect(badInterval.body.code).toBe('VALIDATION_ERROR');

    const badLimit = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: { limit: 0 } });
    expect(badLimit.status).toBe(400);
    expect(badLimit.body.code).toBe('VALIDATION_ERROR');
  });

  it('does not leak another user\'s data', async () => {
    const wallet = await createWallet(token, 'Checking');
    await createTransactionViaApi(token, wallet.id, '1000.00', 'Salary');

    const second = await createTestUser('Second User', 'second@example.com');
    const secondWallet = await createWallet(second.token, 'Other');
    await createTransactionViaApi(
      second.token,
      secondWallet.id,
      '9999.00',
      'Sneaky',
    );

    const response = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: { wallets: [secondWallet.id] } });
    expect(response.status).toBe(200);
    expect(Number(response.body.data.income)).toBe(0);
    expect(Number(response.body.data.expense)).toBe(0);
  });

  it('rejects custom interval without dates (400)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets/monthly-cash-flow/data')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=${token}`])
      .send({ config: { interval: 'custom' } });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post('/dashboard/widgets/income-vs-expense/data')
      .send({ config: {} });
    expect(response.status).toBe(401);
  });
});
