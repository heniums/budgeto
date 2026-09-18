import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register, login } from '../src/auth/service';
import { deleteAllUsers, findUserById } from '../src/auth/repository';
import { verifyPassword } from '../src/auth/password';
import { REFRESH_COOKIE_NAME } from '../src/auth/cookies';

const app = createApp();

async function loginSession(): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  await register({
    name: 'Omar',
    email: 'omar@example.com',
    password: 'password123',
  });
  const result = await login({
    email: 'omar@example.com',
    password: 'password123',
  });
  return { accessToken: result.accessToken, refreshToken: result.refreshToken };
}

describe('POST /auth/change-password', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('changes the password when the current password is correct (200)', async () => {
    const { accessToken, refreshToken } = await loginSession();
    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword123' });
    expect(response.status).toBe(204);

    // The now-dead refresh cookie is cleared alongside the 204...
    const raw = response.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(
      cookies.some(
        (c) =>
          c.startsWith(`${REFRESH_COOKIE_NAME}=`) &&
          c.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT'),
      ),
    ).toBe(true);

    // ...and every pre-change refresh token is revoked server-side, so the
    // stolen pre-change cookie is dead immediately.
    const replay = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=${refreshToken}`);
    expect(replay.status).toBe(401);

    const loginNew = await request(app)
      .post('/auth/login')
      .send({ email: 'omar@example.com', password: 'newpassword123' });
    expect(loginNew.status).toBe(200);

    const user = await findUserById(
      (
        await login({
          email: 'omar@example.com',
          password: 'newpassword123',
        })
      ).user.id,
    );
    expect(
      user && (await verifyPassword('newpassword123', user.passwordHash)),
    ).toBe(true);
  });

  it('rejects a wrong current password (401)', async () => {
    const { accessToken } = await loginSession();
    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpassword123' });
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid new password (400)', async () => {
    const { accessToken } = await loginSession();
    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'password123', newPassword: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unauthenticated request (401)', async () => {
    const response = await request(app)
      .post('/auth/change-password')
      .send({ currentPassword: 'password123', newPassword: 'newpassword123' });
    expect(response.status).toBe(401);
  });
});
