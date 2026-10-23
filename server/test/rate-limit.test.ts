import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { resetConfig } from '../src/config';

// The auth limiters skip when NODE_ENV === 'test' (evaluated per request), so
// pretend to be a development server to exercise them. Each test builds a
// fresh app to get fresh limiter stores.
beforeAll(() => {
  vi.stubEnv('NODE_ENV', 'development');
});

afterAll(() => {
  vi.unstubAllEnvs();
  resetConfig();
});

// Invalid login payload: rejected with 400 before the service touches the
// database, but still counted by the route-level limiter.
function loginRequest(app: Express, ip: string) {
  return request(app)
    .post('/auth/login')
    .set('X-Forwarded-For', ip)
    .send({ email: 'not-an-email', password: 'x' });
}

describe('auth rate limiting', () => {
  it('returns 429 JSON with draft-7 headers once the login limit is hit', async () => {
    const app = createApp();
    // X-Forwarded-For requires app.set('trust proxy', ...): without it,
    // express-rate-limit rejects proxied requests (500) instead of keying on
    // the forwarded client address.
    for (let i = 0; i < 10; i++) {
      const response = await loginRequest(app, '198.51.100.7');
      expect(response.status).toBe(400);
      expect(response.headers['ratelimit']).toBeDefined();
    }

    const blocked = await loginRequest(app, '198.51.100.7');
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(blocked.body.message).toContain('Too many requests');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('keys the limit on the forwarded client address, not the proxy', async () => {
    const app = createApp();
    for (let i = 0; i < 10; i++) {
      expect((await loginRequest(app, '203.0.113.1')).status).toBe(400);
    }
    expect((await loginRequest(app, '203.0.113.1')).status).toBe(429);
    // A different client IP still has its own full budget.
    expect((await loginRequest(app, '203.0.113.2')).status).toBe(400);
  });
});

describe('production JWT_SECRET validation', () => {
  it('refuses to start in production without a 32+ character JWT_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'too-short');
    resetConfig();
    expect(() => createApp()).toThrow(/JWT_SECRET/);
  });

  it('starts in production with a 32+ character JWT_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
    resetConfig();
    expect(() => createApp()).not.toThrow();
  });
});
