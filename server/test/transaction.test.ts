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

  it('rejects when wallet belongs to another user (404)', async () => {
    const otherUser = await register({
      name: 'Other Tx',
      email: 'other-tx@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ amount: '100', description: 'Hack attempt' });
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

  it('rejects when wallet belongs to another user (404)', async () => {
    const otherUser = await register({
      name: 'Other Tx List',
      email: 'other-txlist@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .get(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${otherToken}`);
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

describe('GET /transactions/:id', () => {
  let token: string;
  let walletId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    walletId = await createWallet(token);
  });

  it('returns a transaction by id (200)', async () => {
    const createRes = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '42.50', description: 'Find me' });
    const txId = createRes.body.id;

    const response = await request(app)
      .get(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(txId);
    expect(response.body.amount).toBe('42.50');
    expect(response.body.description).toBe('Find me');
    expect(response.body.walletId).toBe(walletId);
  });

  it('returns 404 for non-existent transaction', async () => {
    const response = await request(app)
      .get('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app).get(
      '/transactions/00000000-0000-0000-0000-000000000000',
    );
    expect(response.status).toBe(401);
  });

  it('returns 404 when transaction belongs to another user', async () => {
    const createRes = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '99', description: 'Mine' });
    const txId = createRes.body.id;

    const otherUser = await register({
      name: 'Other',
      email: 'other-get@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .get(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(response.status).toBe(404);
  });

  it('includes categoryName when transaction has a category', async () => {
    const categoryId = await createCategory(token, 'Food');
    const createRes = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '25.00',
        description: 'Pizza',
        categoryId,
      });
    const txId = createRes.body.id;

    const response = await request(app)
      .get(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.categoryId).toBe(categoryId);
    expect(response.body.categoryName).toBe('Food');
  });
});

describe('PUT /transactions/:id', () => {
  let token: string;
  let walletId: string;

  beforeEach(async () => {
    await deleteAllUsers();
    token = await createTestUser();
    walletId = await createWallet(token);
  });

  async function createTx(
    overrides: Record<string, unknown> = {},
  ): Promise<string> {
    const res = await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100', description: 'Original', ...overrides });
    return res.body.id;
  }

  it('updates amount and description (200)', async () => {
    const txId = await createTx();

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '200', description: 'Updated' });

    expect(response.status).toBe(200);
    expect(response.body.amount).toBe('200');
    expect(response.body.description).toBe('Updated');
  });

  it('updates walletId to another wallet owned by user (200)', async () => {
    const txId = await createTx();
    const otherWallet = await createWallet(token, 'Other Wallet');

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ walletId: otherWallet });

    expect(response.status).toBe(200);
    expect(response.body.walletId).toBe(otherWallet);
  });

  it('updates categoryId (200)', async () => {
    const txId = await createTx();
    const categoryId = await createCategory(token, 'Food');

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId });

    expect(response.status).toBe(200);
    expect(response.body.categoryId).toBe(categoryId);
  });

  it('clears categoryId when null is sent (200)', async () => {
    const categoryId = await createCategory(token, 'Food');
    const txId = await createTx({ categoryId });

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: null });

    expect(response.status).toBe(200);
    expect(response.body.categoryId).toBeNull();
  });

  it('returns 404 for non-existent transaction', async () => {
    const response = await request(app)
      .put('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '50' });
    expect(response.status).toBe(404);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app)
      .put('/transactions/00000000-0000-0000-0000-000000000000')
      .send({ amount: '50' });
    expect(response.status).toBe(401);
  });

  it('returns 404 when transaction belongs to another user', async () => {
    const txId = await createTx();

    const otherUser = await register({
      name: 'Other',
      email: 'other-put@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ amount: '50' });
    expect(response.status).toBe(404);
  });

  it('returns 404 when new walletId belongs to another user', async () => {
    const txId = await createTx();

    const otherUser = await register({
      name: 'Other',
      email: 'other-wallet@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });
    const otherWallet = await createWallet(otherToken, 'Their Wallet');

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ walletId: otherWallet });
    expect(response.status).toBe(404);
  });

  it('returns 404 when new categoryId belongs to another user', async () => {
    const txId = await createTx();

    const otherUser = await register({
      name: 'Other',
      email: 'other-cat@example.com',
      password: 'password123',
    });
    const otherToken = signToken({
      sub: otherUser.id,
      email: otherUser.email,
    });
    const otherCategory = await createCategory(otherToken, 'Other Cat');

    const response = await request(app)
      .put(`/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: otherCategory });
    expect(response.status).toBe(404);
  });
});

describe('GET /transactions (user-scoped)', () => {
  it("returns only the authenticated user's transactions (no cross-user leakage)", async () => {
    await deleteAllUsers();
    const tokenA = await createTestUser();
    const walletA = await createWallet(tokenA, 'A Wallet');

    const userB = await register({
      name: 'User B',
      email: 'b@example.com',
      password: 'password123',
    });
    const tokenB = signToken({ sub: userB.id, email: userB.email });
    const walletB = await createWallet(tokenB, 'B Wallet');

    await request(app)
      .post(`/wallets/${walletA}/transactions`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: '100.00', description: 'A only' });
    await request(app)
      .post(`/wallets/${walletB}/transactions`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: '50.00', description: 'B only' });

    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.transactions).toHaveLength(1);
    expect(response.body.transactions[0].description).toBe('A only');
  });

  it('rejects unauthenticated requests (401)', async () => {
    const response = await request(app).get('/transactions');
    expect(response.status).toBe(401);
  });

  it('returns transactions newest first', async () => {
    await deleteAllUsers();
    const token = await createTestUser();
    const walletId = await createWallet(token);
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '10', description: 'Old' });
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '20', description: 'New' });

    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.transactions[0].description).toBe('New');
  });

  it('includes categoryId and categoryName in transaction list', async () => {
    await deleteAllUsers();
    const token = await createTestUser();
    const walletId = await createWallet(token);
    const categoryId = await createCategory(token, 'Food');

    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '50.00',
        description: 'Groceries',
        categoryId,
      });
    await request(app)
      .post(`/wallets/${walletId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '20.00', description: 'No cat' });

    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.transactions).toHaveLength(2);

    const categorized = response.body.transactions.find(
      (tx: Record<string, unknown>) => tx.description === 'Groceries',
    );
    const uncategorized = response.body.transactions.find(
      (tx: Record<string, unknown>) => tx.description === 'No cat',
    );

    expect(categorized.categoryId).toBe(categoryId);
    expect(categorized.categoryName).toBe('Food');
    expect(uncategorized.categoryId).toBeNull();
    expect(uncategorized.categoryName).toBeNull();
  });
});
