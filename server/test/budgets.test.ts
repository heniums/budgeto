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

const app = createApp();

async function createTestUser(
  name = 'Budget Tester',
  email = 'budget@example.com',
): Promise<string> {
  const { user } = await register({
    name,
    email,
    password: 'password123',
  });
  return signToken({ sub: user.id, email: user.email, name: user.name });
}

async function createCategory(
  token: string,
  name: string,
): Promise<{ id: string }> {
  const response = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name,
      color: '#FF5733',
      icon: 'shopping-cart',
    });
  expect(response.status).toBe(201);
  return response.body;
}

async function createWallet(
  token: string,
  name: string,
): Promise<{ id: string }> {
  const response = await request(app)
    .post('/wallets')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, currency: 'USD' });
  expect(response.status).toBe(201);
  return response.body;
}

const today = dayjs();
const currentMonthStart = today.startOf('month').format('YYYY-MM-DD');
const currentMonthEnd = today.endOf('month').format('YYYY-MM-DD');

describe('POST /budgets', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('creates a monthly budget without explicit dates (201)', async () => {
    const groceries = await createCategory(token, 'Groceries');
    const dining = await createCategory(token, 'Dining');
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly Spending',
        icon: 'wallet',
        color: '#1f8a4c',
        type: 'spending',
        period: 'monthly',
        categories: [
          { categoryId: groceries.id, limitAmount: '500.00' },
          { categoryId: dining.id, limitAmount: '300.00' },
        ],
      });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Monthly Spending');
    expect(response.body.totalAmount).toBe('800.00');
    expect(response.body.categories).toHaveLength(2);
    expect(response.body.spent).toBe('0.00');
    expect(response.body.id).toBeDefined();
    expect(response.body.period.window.startDate).toBe(currentMonthStart);
    expect(response.body.period.window.endDate).toBe(currentMonthEnd);
    // startDate/endDate should not be in response
    expect(response.body.startDate).toBeUndefined();
    expect(response.body.endDate).toBeUndefined();
  });

  it('creates a custom budget with explicit dates (201)', async () => {
    const groceries = await createCategory(token, 'Groceries');
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Custom Budget',
        period: 'custom',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        categories: [{ categoryId: groceries.id, limitAmount: '300.00' }],
      });
    expect(response.status).toBe(201);
    expect(response.body.period.window.startDate).toBe('2024-01-01');
    expect(response.body.period.window.endDate).toBe('2024-01-31');
  });

  it('rejects custom period without dates (400)', async () => {
    const groceries = await createCategory(token, 'Groceries');
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Missing Dates',
        period: 'custom',
        categories: [{ categoryId: groceries.id, limitAmount: '300.00' }],
      });
    expect(response.status).toBe(400);
  });

  it('derives total from category limits (201)', async () => {
    const groceries = await createCategory(token, 'Groceries');
    const dining = await createCategory(token, 'Dining');
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sum Derived Total',
        period: 'monthly',
        categories: [
          { categoryId: groceries.id, limitAmount: '80.00' },
          { categoryId: dining.id, limitAmount: '80.00' },
        ],
      });
    expect(response.status).toBe(201);
    expect(response.body.totalAmount).toBe('160.00');
    expect(response.body.categories).toHaveLength(2);
  });

  it('rejects duplicate categoryId in categories (400)', async () => {
    const groceries = await createCategory(token, 'Groceries');
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Duplicate Categories',
        period: 'monthly',
        categories: [
          { categoryId: groceries.id, limitAmount: '50.00' },
          { categoryId: groceries.id, limitAmount: '60.00' },
        ],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body.details)).toContain(
      'Duplicate categoryId in categories',
    );
    const listRes = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.budgets).toHaveLength(0);
  });

  it('accepts any category in budget (201)', async () => {
    const salary = await createCategory(token, 'Salary');
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Budget With Income Category',
        period: 'monthly',
        categories: [{ categoryId: salary.id, limitAmount: '50.00' }],
      });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Budget With Income Category');
  });

  it('rejects invalid category (404)', async () => {
    const response = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Bad Budget',
        period: 'monthly',
        categories: [
          {
            categoryId: '00000000-0000-0000-0000-000000000000',
            limitAmount: '50.00',
          },
        ],
      });
    expect(response.status).toBe(404);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const groceries = await createCategory(token, 'Groceries');
    const response = await request(app)
      .post('/budgets')
      .send({
        name: 'No Auth',
        period: 'monthly',
        categories: [{ categoryId: groceries.id, limitAmount: '50.00' }],
      });
    expect(response.status).toBe(401);
  });
});

describe('GET /budgets', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('returns an empty list when no budgets exist (200)', async () => {
    const response = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.budgets).toEqual([]);
  });

  it('includes spent amount from transactions in current month (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const wallet = await createWallet(token, 'Cash');

    const today = dayjs().toISOString();
    await request(app)
      .post(`/wallets/${wallet.id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '-50.00',
        description: 'Groceries',
        categoryId: category.id,
        date: today,
      });

    await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.budgets).toHaveLength(1);
    expect(response.body.budgets[0].spent).toBe('50.00');
    expect(response.body.budgets[0].totalAmount).toBe('200.00');
    expect(response.body.budgets[0].categories[0].spent).toBe('50.00');
    expect(response.body.budgets[0].period.window.startDate).toBe(
      currentMonthStart,
    );
    expect(response.body.budgets[0].period.window.endDate).toBe(
      currentMonthEnd,
    );
  });

  it('reports overspend without clamping (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const wallet = await createWallet(token, 'Cash');

    await request(app)
      .post(`/wallets/${wallet.id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '-250.00',
        description: 'Big shop',
        categoryId: category.id,
        date: dayjs().toISOString(),
      });

    await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tight Budget',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.budgets[0].spent).toBe('250.00');
    expect(response.body.budgets[0].totalAmount).toBe('200.00');
    expect(response.body.budgets[0].categories[0].spent).toBe('250.00');
  });

  it('ignores a transaction outside the current period (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const wallet = await createWallet(token, 'Cash');

    // Transaction in previous month (outside current period window)
    const lastMonth = dayjs().subtract(1, 'month').toISOString();
    await request(app)
      .post(`/wallets/${wallet.id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '-30.00',
        description: 'Groceries',
        categoryId: category.id,
        date: lastMonth,
      });

    await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.budgets[0].spent).toBe('0.00');
  });

  it('returns budgets with period window for the requested period (200)', async () => {
    const category = await createCategory(token, 'Groceries');

    await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .get('/budgets?period=2024-03')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.budgets).toHaveLength(1);
    expect(response.body.budgets[0].period.window.startDate).toBe('2024-03-01');
    expect(response.body.budgets[0].period.window.endDate).toBe('2024-03-31');
  });
});

describe('GET /budgets/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('returns a monthly budget with period window for the requested period (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly Budget',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '500.00' }],
      });

    const response = await request(app)
      .get(`/budgets/${created.body.id}?period=2024-03`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.period.window.startDate).toBe('2024-03-01');
    expect(response.body.period.window.endDate).toBe('2024-03-31');
    expect(response.body.period.type).toBe('monthly');
  });

  it('computes spent for the requested period, ignoring transactions outside it (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const wallet = await createWallet(token, 'Cash');

    // Transaction in January 2024
    await request(app)
      .post(`/wallets/${wallet.id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '-50.00',
        description: 'Jan groceries',
        categoryId: category.id,
        date: '2024-01-15T12:00:00.000Z',
      });

    // Transaction in March 2024
    await request(app)
      .post(`/wallets/${wallet.id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '-75.00',
        description: 'Mar groceries',
        categoryId: category.id,
        date: '2024-03-10T12:00:00.000Z',
      });

    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly Budget',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '500.00' }],
      });

    // Get budget for March 2024 — should only include the $75 transaction
    const marResponse = await request(app)
      .get(`/budgets/${created.body.id}?period=2024-03`)
      .set('Authorization', `Bearer ${token}`);
    expect(marResponse.status).toBe(200);
    expect(marResponse.body.spent).toBe('75.00');
    expect(marResponse.body.totalAmount).toBe('500.00');
    expect(marResponse.body.categories[0].spent).toBe('75.00');

    // Get budget for January 2024 — should only include the $50 transaction
    const janResponse = await request(app)
      .get(`/budgets/${created.body.id}?period=2024-01`)
      .set('Authorization', `Bearer ${token}`);
    expect(janResponse.status).toBe(200);
    expect(janResponse.body.spent).toBe('50.00');
    expect(janResponse.body.categories[0].spent).toBe('50.00');
  });

  it('returns a yearly budget with full-year window for the requested period (200)', async () => {
    const category = await createCategory(token, 'Rent');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Yearly Budget',
        period: 'yearly',
        categories: [{ categoryId: category.id, limitAmount: '6000.00' }],
      });

    const response = await request(app)
      .get(`/budgets/${created.body.id}?period=2024-06`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.period.window.startDate).toBe('2024-01-01');
    expect(response.body.period.window.endDate).toBe('2024-12-31');
    expect(response.body.period.type).toBe('yearly');
  });

  it('returns current period window when no period param is provided (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly Budget',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '500.00' }],
      });

    const response = await request(app)
      .get(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.period.window.startDate).toBe(currentMonthStart);
    expect(response.body.period.window.endDate).toBe(currentMonthEnd);
  });

  it('rejects invalid period format (400)', async () => {
    const category = await createCategory(token, 'Groceries');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly Budget',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '500.00' }],
      });

    const response = await request(app)
      .get(`/budgets/${created.body.id}?period=invalid`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

describe('PUT /budgets/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('updates category limits and recomputes total (200)', async () => {
    const category = await createCategory(token, 'Groceries');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .put(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        categories: [{ categoryId: category.id, limitAmount: '300.00' }],
      });
    expect(response.status).toBe(200);
    expect(response.body.totalAmount).toBe('300.00');
    expect(response.body.categories[0].limitAmount).toBe('300.00');
    expect(response.body.period.window.startDate).toBe(currentMonthStart);
    expect(response.body.period.window.endDate).toBe(currentMonthEnd);
  });

  it('rejects duplicate categoryId and keeps saved limits (400)', async () => {
    const category = await createCategory(token, 'Groceries');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .put(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [
          { categoryId: category.id, limitAmount: '50.00' },
          { categoryId: category.id, limitAmount: '60.00' },
        ],
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body.details)).toContain(
      'Duplicate categoryId in categories',
    );

    // Saved category limits must be untouched — no wipe.
    const getRes = await request(app)
      .get(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.categories).toHaveLength(1);
    expect(getRes.body.categories[0].categoryId).toBe(category.id);
    expect(getRes.body.categories[0].limitAmount).toBe('200.00');
  });
});

describe('DELETE /budgets/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllTransactions();
    await deleteAllBudgets();
    await deleteAllWallets();
    await deleteAllCategories();
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('deletes a budget (204)', async () => {
    const category = await createCategory(token, 'Groceries');
    const created = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Monthly',
        period: 'monthly',
        categories: [{ categoryId: category.id, limitAmount: '200.00' }],
      });

    const response = await request(app)
      .delete(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(204);

    const list = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.budgets).toHaveLength(0);
  });
});
