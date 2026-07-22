import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import { signToken } from '../src/auth/token';

const app = createApp();

async function createTestUser(): Promise<string> {
  const user = await register({
    name: 'Wallet Tester',
    email: 'wallet@example.com',
    password: 'password123',
  });
  return signToken({ sub: user.id, email: user.email });
}

describe('POST /wallets', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('creates a wallet with valid input (201)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Wallet' });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('My Wallet');
    expect(response.body.id).toBeDefined();
    expect(response.body.currency).toBe('USD');
  });

  it('creates a wallet with an explicit currency (201)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Euro Wallet', currency: 'EUR' });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Euro Wallet');
    expect(response.body.currency).toBe('EUR');
  });

  it('normalizes lowercase currency codes (201)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lowercase Wallet', currency: 'eur' });
    expect(response.status).toBe(201);
    expect(response.body.currency).toBe('EUR');
  });

  it('rejects empty currency (400)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Empty Currency', currency: '' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid currency code (400)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invalid Currency', currency: 'XYZ' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects currency code that is too short (400)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Short Currency', currency: 'US' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing name (400)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty name (400)', async () => {
    const response = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post('/wallets')
      .send({ name: 'No Auth' });
    expect(response.status).toBe(401);
  });
});

describe('GET /wallets', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('returns an empty list when no wallets exist (200)', async () => {
    const response = await request(app)
      .get('/wallets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.wallets).toEqual([]);
  });

  it('lists wallets belonging to the authenticated user (200)', async () => {
    await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Wallet A' });
    await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Wallet B', currency: 'EUR' });

    const response = await request(app)
      .get('/wallets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.wallets).toHaveLength(2);
    expect(response.body.wallets[0].name).toBe('Wallet A');
    expect(response.body.wallets[0].currency).toBe('USD');
    expect(response.body.wallets[1].name).toBe('Wallet B');
    expect(response.body.wallets[1].currency).toBe('EUR');
    expect(response.body.wallets[0].balance).toBeDefined();
  });
});

describe('GET /wallets/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('returns a single wallet by id (200)', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Single Wallet', currency: 'GBP' });
    const walletId = created.body.id;

    const response = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Single Wallet');
    expect(response.body.currency).toBe('GBP');
    expect(response.body.balance).toBeDefined();
  });

  it('returns 404 for a non-existent wallet', async () => {
    const response = await request(app)
      .get('/wallets/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('returns 404 when wallet belongs to a different user', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'User A Wallet' });
    const walletId = wallet.body.id;

    const otherUser = await register({
      name: 'Other',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(response.status).toBe(404);
  });
});

describe('PUT /wallets/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('updates a wallet name (200)', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original' });
    const walletId = created.body.id;

    const response = await request(app)
      .put(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated');
  });

  it('updates a wallet currency (200)', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original' });
    const walletId = created.body.id;

    const response = await request(app)
      .put(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currency: 'JPY' });
    expect(response.status).toBe(200);
    expect(response.body.currency).toBe('JPY');

    const getResponse = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getResponse.body.currency).toBe('JPY');
  });

  it('rejects invalid currency update (400)', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original' });
    const walletId = created.body.id;

    const response = await request(app)
      .put(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currency: 'XYZ' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty name update (400)', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original' });
    const walletId = created.body.id;

    const response = await request(app)
      .put(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(response.status).toBe(400);
  });

  it('returns 404 when updating a wallet owned by another user', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'User A Wallet' });
    const walletId = wallet.body.id;

    const otherUser = await register({
      name: 'Other',
      email: 'other2@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .put(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hacked' });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /wallets/:id', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('deletes an empty wallet (204)', async () => {
    const created = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Empty Wallet' });
    const walletId = created.body.id;

    const response = await request(app)
      .delete(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(204);
  });

  it('returns 404 for a non-existent wallet', async () => {
    const response = await request(app)
      .delete('/wallets/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a wallet owned by another user', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'User A Wallet' });
    const walletId = wallet.body.id;

    const otherUser = await register({
      name: 'Other',
      email: 'other3@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .delete(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(response.status).toBe(404);
  });
});

describe('POST /wallets/:id/adjust', () => {
  let token: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
  });

  it('adjusts a wallet balance upward and creates a Balance Adjustment category (200)', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Checking' });
    const walletId = wallet.body.id;

    const response = await request(app)
      .post(`/wallets/${walletId}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetBalance: '100.00' });

    expect(response.status).toBe(200);
    expect(response.body.balance).toBe('100.00');

    // Verify a "Balance Adjustment" category was auto-created
    const categories = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(categories.status).toBe(200);
    const adjustmentCat = categories.body.categories.find(
      (c: { name: string }) => c.name === 'Balance Adjustment',
    );
    expect(adjustmentCat).toBeDefined();
  });

  it('adjusts a wallet balance downward reusing existing category (200)', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Checking' });
    const walletId = wallet.body.id;

    // First adjustment: 0 → 100
    await request(app)
      .post(`/wallets/${walletId}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetBalance: '100.00' });

    // Second adjustment: 100 → 50
    const response = await request(app)
      .post(`/wallets/${walletId}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetBalance: '50.00' });

    expect(response.status).toBe(200);
    expect(response.body.balance).toBe('50.00');

    // Verify only one "Balance Adjustment" category exists
    const categories = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);
    const adjustmentCats = categories.body.categories.filter(
      (c: { name: string }) => c.name === 'Balance Adjustment',
    );
    expect(adjustmentCats).toHaveLength(1);
  });

  it('rejects missing targetBalance (400)', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Checking' });

    const response = await request(app)
      .post(`/wallets/${wallet.body.id}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-numeric targetBalance (400)', async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Checking' });

    const response = await request(app)
      .post(`/wallets/${wallet.body.id}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetBalance: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for a non-existent wallet', async () => {
    const response = await request(app)
      .post('/wallets/00000000-0000-0000-0000-000000000000/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetBalance: '100.00' });

    expect(response.status).toBe(404);
  });

  it("returns 404 for another user's wallet", async () => {
    const wallet = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Wallet' });

    const otherUser = await register({
      name: 'Other',
      email: 'other-adjust@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .post(`/wallets/${wallet.body.id}/adjust`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ targetBalance: '100.00' });

    expect(response.status).toBe(404);
  });
});
