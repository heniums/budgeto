import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { register, login } from '../src/auth/service';
import { deleteAllUsers, findUserById } from '../src/auth/repository';
import { verifyPassword } from '../src/auth/password';

const app = createApp();

async function loginToken(): Promise<string> {
  await register({
    name: 'Omar',
    email: 'omar@example.com',
    password: 'password123',
  });
  const result = await login({
    email: 'omar@example.com',
    password: 'password123',
  });
  return result.token;
}

describe('POST /auth/change-password', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('changes the password when the current password is correct (200)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword123' });
    expect(response.status).toBe(204);

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
    expect(user && (await verifyPassword('newpassword123', user.passwordHash))).toBe(
      true,
    );
  });

  it('rejects a wrong current password (401)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpassword123' });
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid new password (400)', async () => {
    const token = await loginToken();
    const response = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
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
