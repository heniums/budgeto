import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import { signToken } from '../src/auth/token';

const app = createApp();

async function createTestUser(): Promise<string> {
  const user = await register({
    name: 'Tx Tester',
    email: 'tx@example.com',
    password: 'password123',
  });
  return signToken({ sub: user.id, email: user.email });
}

async function createWallet(
  token: string,
  name = 'Test Wallet',
): Promise<string> {
  const response = await request(app)
    .post('/wallets')
    .set('Authorization', `Bearer ${token}`)
    .send({ name });
  return response.body.id;
}

async function createCategory(token: string, name = 'Food'): Promise<string> {
  const response = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, type: 'expense', color: '#ff0000', icon: 'Tag' });
  return response.body.id;
}

describe('POST /wallets/:id/transactions', () => {
  let token: string;
  let walletId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    walletId = await createWallet(token);
  });

  it('creates a transaction with positive amount (201)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', description: 'Deposit' });
    expect(response.status).toBe(201);
    expect(response.body.amount).toBe('100.00');
    expect(response.body.description).toBe('Deposit');
    expect(response.body.id).toBeDefined();
  });

  it('creates a transaction with negative amount (201)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '-50.00', description: 'Withdrawal' });
    expect(response.status).toBe(201);
    expect(response.body.amount).toBe('-50.00');
  });

  it('rejects missing amount (400)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No amount' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects zero amount (400)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '0', description: 'Zero' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .send({ amount: '100', description: 'No auth' });
    expect(response.status).toBe(401);
  });

  it('rejects non-existent wallet (404)', async () => {
    const response = await request(app)
      .post('/wallets/00000000-0000-0000-0000-000000000000/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100', description: 'Bad wallet' });
    expect(response.status).toBe(404);
  });
});

describe('POST /wallets/:id/transactions — category', () => {
  let token: string;
  let walletId: string;
  let categoryId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    walletId = await createWallet(token);
    categoryId = await createCategory(token);
  });

  it('assigns a category to the transaction (201)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', description: 'Groceries', categoryId });
    expect(response.status).toBe(201);
    expect(response.body.categoryId).toBe(categoryId);
  });

  it('creates without a category (201)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', description: 'No category' });
    expect(response.status).toBe(201);
    expect(response.body.categoryId).toBeNull();
  });

  it('rejects a non-existent category (404)', async () => {
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '100.00',
        description: 'Bad category',
        categoryId: '00000000-0000-0000-0000-000000000000',
      });
    expect(response.status).toBe(404);
  });

  it('rejects a category owned by another user (404)', async () => {
    const otherUser = await register({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });
    const otherCategory = await createCategory(otherToken, 'Other');
    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '100.00',
        description: 'Cross-user category',
        categoryId: otherCategory,
      });
    expect(response.status).toBe(404);
  });
});

describe('GET /wallets/:id/transactions', () => {
  let token: string;
  let walletId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    walletId = await createWallet(token);
  });

  it('returns empty list when no transactions exist (200)', async () => {
    const response = await request(app)
      .get(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.transactions).toEqual([]);
  });

  it('lists transactions for the wallet (200)', async () => {
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', description: 'First' });
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '-50.00', description: 'Second' });

    const response = await request(app)
      .get(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.transactions).toHaveLength(2);
    expect(response.body.transactions[0].description).toBe('Second');
    expect(response.body.transactions[1].description).toBe('First');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app).get(
      `/wallets/${walletId}/transactions`,
    );
    expect(response.status).toBe(401);
  });

  it('rejects non-existent wallet (404)', async () => {
    const response = await request(app)
      .get('/wallets/00000000-0000-0000-0000-000000000000/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });
});

describe('POST /wallets/transfer', () => {
  let token: string;
  let sourceId: string;
  let targetId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    sourceId = await createWallet(token, 'Source Wallet');
    targetId = await createWallet(token, 'Target Wallet');
  });

  it('transfers amount from source to target (200)', async () => {
    const response = await request(app)
      .post('/wallets/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceId,
        targetId,
        amount: '50.00',
        description: 'Test transfer',
      });
    expect(response.status).toBe(200);
    expect(response.body.sourceTransaction).toBeDefined();
    expect(response.body.targetTransaction).toBeDefined();
    expect(response.body.sourceTransaction.amount).toBe('-50.00');
    expect(response.body.targetTransaction.amount).toBe('50.00');

    const sourceWallet = await request(app)
      .get(`/wallets/${sourceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(sourceWallet.body.balance).toBe('-50.00');

    const targetWallet = await request(app)
      .get(`/wallets/${targetId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(targetWallet.body.balance).toBe('50.00');
  });

  it('rejects when source wallet not found (404)', async () => {
    const response = await request(app)
      .post('/wallets/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceId: '00000000-0000-0000-0000-000000000000',
        targetId,
        amount: '50.00',
      });
    expect(response.status).toBe(404);
  });

  it('rejects when target wallet not found (404)', async () => {
    const response = await request(app)
      .post('/wallets/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceId,
        targetId: '00000000-0000-0000-0000-000000000000',
        amount: '50.00',
      });
    expect(response.status).toBe(404);
  });

  it('rejects zero or negative transfer amount (400)', async () => {
    const response = await request(app)
      .post('/wallets/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ sourceId, targetId, amount: '0' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post('/wallets/transfer')
      .send({ sourceId, targetId, amount: '50.00' });
    expect(response.status).toBe(401);
  });

  it('rejects transfer to same wallet (400)', async () => {
    const response = await request(app)
      .post('/wallets/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ sourceId, targetId: sourceId, amount: '50.00' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('balance in wallet endpoints', () => {
  let token: string;
  let walletId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    walletId = await createWallet(token);
  });

  it('reflects transaction sum in wallet balance', async () => {
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '200.00', description: 'Income' });
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '-75.50', description: 'Expense' });

    const response = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.balance).toBe('124.50');
  });

  it('shows zero balance for wallet with no transactions', async () => {
    const response = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.balance).toBe('0');
  });

  it('reflects balances in wallet list', async () => {
    await createWallet(token, 'Second');
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', description: 'Deposit' });

    const response = await request(app)
      .get('/wallets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    const first = response.body.wallets.find(
      (w: { name: string }) => w.name === 'Test Wallet',
    );
    const second = response.body.wallets.find(
      (w: { name: string }) => w.name === 'Second',
    );
    expect(first.balance).toBe('100.00');
    expect(second.balance).toBe('0');
  });
});
