import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '../src/auth/cookies';

const app = createApp();

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

  it('returns a user and sets auth cookies with valid credentials (200)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'judy@example.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('judy@example.com');
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE_NAME}=`))).toBe(
      true,
    );
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`))).toBe(
      true,
    );
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
