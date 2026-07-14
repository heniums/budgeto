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
      .send({ name: 'Wallet B' });

    const response = await request(app)
      .get('/wallets')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.wallets).toHaveLength(2);
    expect(response.body.wallets[0].name).toBe('Wallet A');
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
      .send({ name: 'Single Wallet' });
    const walletId = created.body.id;

    const response = await request(app)
      .get(`/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Single Wallet');
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
