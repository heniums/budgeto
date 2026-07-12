import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/auth/service';
import { UserRepository } from '../src/auth/repository';

const app = createApp();
const service = new AuthService();
const repository = new UserRepository();

async function loginToken(): Promise<string> {
  const result = await service.login({
    email: 'mallory@example.com',
    password: 'password123',
  });
  return result.token;
}

describe('Protected routes', () => {
  beforeEach(async () => {
    await repository.deleteAll();
    await service.register({
      email: 'mallory@example.com',
      password: 'password123',
    });
  });

  it('rejects an unauthenticated request to /auth/me (401)', async () => {
    const response = await request(app).get('/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed Authorization header (401)', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Token abc');
    expect(response.status).toBe(401);
  });

  it('rejects an invalid token (401)', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(response.status).toBe(401);
  });

  it('returns the user for a valid token (200)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('mallory@example.com');
  });
});
