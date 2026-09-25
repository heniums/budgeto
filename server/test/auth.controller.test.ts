import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import { REFRESH_COOKIE_NAME } from '../src/auth/cookies';

const app = createApp();

async function loginAndCaptureRefreshCookie(email: string): Promise<string> {
  const response = await request(app)
    .post('/auth/login')
    .send({ email, password: 'password123' });
  const raw = response.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const cookie = cookies.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
  if (!cookie) {
    throw new Error(`login for ${email} did not set a refresh cookie`);
  }
  return cookie;
}

describe('POST /auth/register', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('creates a user with valid input (201)', async () => {
    const response = await request(app).post('/auth/register').send({
      name: 'Heidi',
      email: 'heidi@example.com',
      password: 'password123',
    });
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('heidi@example.com');
    expect(response.body.user.name).toBe('Heidi');
    expect(response.body.user.id).toBeDefined();
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.accessToken.length).toBeGreaterThan(0);
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`))).toBe(
      true,
    );
  });

  it('rejects invalid input (400)', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'bad', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email (409)', async () => {
    await register({
      name: 'Ivan',
      email: 'ivan@example.com',
      password: 'password123',
    });
    const response = await request(app).post('/auth/register').send({
      name: 'Ivan',
      email: 'ivan@example.com',
      password: 'password123',
    });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await deleteAllUsers();
    await register({
      name: 'Judy',
      email: 'judy@example.com',
      password: 'password123',
    });
  });

  it('returns a user, access token, and refresh cookie with valid credentials (200)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'judy@example.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('judy@example.com');
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.accessToken.length).toBeGreaterThan(0);
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    // Only the refresh cookie is ever set — an access-token cookie must not
    // come back.
    expect(cookies).toHaveLength(1);
    const refreshCookie = cookies.find((c) =>
      c.startsWith(`${REFRESH_COOKIE_NAME}=`),
    );
    expect(refreshCookie).toBeDefined();
    // Security-critical flags: invisible to client-side JS, scheme fallback
    // (Lax), path-scoped, and bound to the refresh TTL.
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('SameSite=Lax');
    expect(refreshCookie).toContain('Path=/');
    expect(refreshCookie).toContain('Max-Age=');
  });

  it('rejects an unknown user (401)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(response.status).toBe(401);
  });

  it('rejects a wrong password (401)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'judy@example.com', password: 'wrong' });
    expect(response.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  beforeEach(async () => {
    await deleteAllUsers();
    await register({
      name: 'Karen',
      email: 'karen@example.com',
      password: 'password123',
    });
  });

  it('returns a user, access token, and rotated refresh cookie with a valid cookie (200)', async () => {
    const cookie = await loginAndCaptureRefreshCookie('karen@example.com');
    const response = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('karen@example.com');
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.accessToken.length).toBeGreaterThan(0);
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`))).toBe(
      true,
    );
  });

  it('rotates the refresh token, rejecting the original cookie afterwards (401)', async () => {
    const cookie = await loginAndCaptureRefreshCookie('karen@example.com');
    const first = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookie);
    expect(first.status).toBe(200);

    const replay = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookie);
    expect(replay.status).toBe(401);
  });

  it('rejects a missing refresh cookie (401)', async () => {
    const response = await request(app).post('/auth/refresh');
    expect(response.status).toBe(401);
  });

  it('rejects a garbage refresh token (401)', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=not-a-real-token`);
    expect(response.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  beforeEach(async () => {
    await deleteAllUsers();
    await register({
      name: 'Leonardo',
      email: 'leonardo@example.com',
      password: 'password123',
    });
  });

  it('clears the refresh cookie and invalidates the stored token (204)', async () => {
    const cookie = await loginAndCaptureRefreshCookie('leonardo@example.com');
    const response = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookie);
    expect(response.status).toBe(204);
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(
      cookies.some(
        (c) =>
          c.startsWith(`${REFRESH_COOKIE_NAME}=`) &&
          c.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT'),
      ),
    ).toBe(true);

    const replay = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookie);
    expect(replay.status).toBe(401);
  });
});
