import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register, login } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';

const app = createApp();

async function loginToken(): Promise<string> {
  const result = await login({
    email: 'mallory@example.com',
    password: 'password123',
  });
  return result.accessToken;
}

describe('Protected routes', () => {
  beforeEach(async () => {
    await deleteAllUsers();
    await register({
      name: 'Mallory',
      email: 'mallory@example.com',
      password: 'password123',
    });
  });

  it('rejects an unauthenticated request to /auth/me (401)', async () => {
    const response = await request(app).get('/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects a request with a non-Bearer scheme (401)', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Token abc123');
    expect(response.status).toBe(401);
  });

  it('rejects a Bearer header with an empty token (401)', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer ');
    expect(response.status).toBe(401);
  });

  it('rejects an invalid Bearer token (401)', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(response.status).toBe(401);
  });

  it('accepts a lowercase bearer scheme (200)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('mallory@example.com');
  });

  it('ignores cookies — even one carrying a valid access token (401)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', `budgeto_access_token=${token}`);
    expect(response.status).toBe(401);
  });

  it('returns the user for a valid Bearer token (200)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('mallory@example.com');
  });
});
