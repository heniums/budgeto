import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import { signToken } from '../src/auth/token';

const app = createApp();

async function createTestUser(
  name = 'Category Tester',
  email = 'category@example.com',
): Promise<string> {
  const user = await register({
    name,
    email,
    password: 'password123',
  });
  return signToken({ sub: user.id, email: user.email });
}

describe('POST /categories', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('creates a category with valid input (201)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Groceries');
    expect(response.body.type).toBe('expense');
    expect(response.body.color).toBe('#FF5733');
    expect(response.body.icon).toBe('shopping-cart');
    expect(response.body.id).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
  });

  it('creates an income category (201)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Salary', type: 'income', color: '#33FF57', icon: 'banknote' });
    expect(response.status).toBe(201);
    expect(response.body.type).toBe('income');
  });

  it('rejects missing name (400)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing type (400)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid type (400)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'invalid', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing color (400)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', icon: 'shopping-cart' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing icon (400)', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post('/categories')
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(401);
  });
});

describe('GET /categories', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('returns an empty list when no categories exist (200)', async () => {
    const response = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.categories).toEqual([]);
  });

  it('lists categories belonging to the authenticated user (200)', async () => {
    await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Salary', type: 'income', color: '#33FF57', icon: 'banknote' });

    const response = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.categories).toHaveLength(2);
    expect(response.body.categories[0].name).toBe('Groceries');
    expect(response.body.categories[1].name).toBe('Salary');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app).get('/categories');
    expect(response.status).toBe(401);
  });
});

describe('GET /categories/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('returns a single category by id (200)', async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const response = await request(app)
      .get(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Groceries');
    expect(response.body.type).toBe('expense');
    expect(response.body.color).toBe('#FF5733');
    expect(response.body.icon).toBe('shopping-cart');
  });

  it('returns 404 for a non-existent category', async () => {
    const response = await request(app)
      .get('/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .get('/categories/00000000-0000-0000-0000-000000000000');
    expect(response.status).toBe(401);
  });
});

describe('PUT /categories/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('updates category name (200)', async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const response = await request(app)
      .put(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Food', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Food');
  });

  it('updates all category properties (200)', async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const response = await request(app)
      .put(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Salary', type: 'income', color: '#33FF57', icon: 'banknote' });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Salary');
    expect(response.body.type).toBe('income');
    expect(response.body.color).toBe('#33FF57');
    expect(response.body.icon).toBe('banknote');
  });

  it('returns 404 for a non-existent category', async () => {
    const response = await request(app)
      .put('/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Food', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(404);
  });

  it('rejects invalid type (400)', async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const response = await request(app)
      .put(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'invalid', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .put('/categories/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Food', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(401);
  });
});

describe('DELETE /categories/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('deletes a category (204)', async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const response = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(204);
  });

  it('returns 404 for a non-existent category', async () => {
    const response = await request(app)
      .delete('/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .delete('/categories/00000000-0000-0000-0000-000000000000');
    expect(response.status).toBe(401);
  });
});

describe('category ownership enforcement', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('returns 404 when accessing another user category', async () => {
    const userAToken = await createTestUser('User A', 'usera@example.com');
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const userBToken = await createTestUser('User B', 'userb@example.com');

    const response = await request(app)
      .get(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(response.status).toBe(404);
  });

  it('returns 404 when updating another user category', async () => {
    const userAToken = await createTestUser('User A', 'usera@example.com');
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const userBToken = await createTestUser('User B', 'userb@example.com');

    const response = await request(app)
      .put(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Hacked', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting another user category', async () => {
    const userAToken = await createTestUser('User A', 'usera@example.com');
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Groceries', type: 'expense', color: '#FF5733', icon: 'shopping-cart' });
    const categoryId = created.body.id;

    const userBToken = await createTestUser('User B', 'userb@example.com');

    const response = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(response.status).toBe(404);
  });
});
