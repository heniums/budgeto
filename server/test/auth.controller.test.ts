import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/auth/service';
import { UserRepository } from '../src/auth/repository';

const app = createApp();
const service = new AuthService();
const repository = new UserRepository();

describe('POST /auth/register', () => {
  beforeEach(async () => {
    await repository.deleteAll();
  });

  it('creates a user with valid input (201)', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'heidi@example.com', password: 'password123' });
    expect(response.status).toBe(201);
    expect(response.body.email).toBe('heidi@example.com');
    expect(response.body.id).toBeDefined();
  });

  it('rejects invalid input (400)', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'bad', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email (409)', async () => {
    await service.register({
      email: 'ivan@example.com',
      password: 'password123',
    });
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'ivan@example.com', password: 'password123' });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await repository.deleteAll();
    await service.register({
      email: 'judy@example.com',
      password: 'password123',
    });
  });

  it('returns a token with valid credentials (200)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'judy@example.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTypeOf('string');
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
