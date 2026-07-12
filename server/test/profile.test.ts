import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register, login } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';

const app = createApp();

async function loginToken(): Promise<{ token: string; userId: string }> {
  const result = await register({
    name: 'Nadia',
    email: 'nadia@example.com',
    password: 'password123',
  });
  const loggedIn = await login({
    email: 'nadia@example.com',
    password: 'password123',
  });
  return { token: loggedIn.token, userId: result.id };
}

describe('GET /auth/me', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('returns the user name for a valid token (200)', async () => {
    const { token } = await loginToken();
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('nadia@example.com');
    expect(response.body.user.name).toBe('Nadia');
  });
});

describe('PATCH /auth/me', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('updates the user name for a valid token (200)', async () => {
    const { token } = await loginToken();
    const response = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nadia R.' });
    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe('Nadia R.');

    const me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.body.user.name).toBe('Nadia R.');
  });

  it('rejects an update without a name (400)', async () => {
    const { token } = await loginToken();
    const response = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unauthenticated update (401)', async () => {
    const response = await request(app).patch('/auth/me').send({
      name: 'No Auth',
    });
    expect(response.status).toBe(401);
  });
});
