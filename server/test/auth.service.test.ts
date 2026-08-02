import { describe, it, expect, beforeEach } from 'vitest';
import { register, login } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';

describe('register', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('registers a new user', async () => {
    const result = await register({
      name: 'Dave',
      email: 'dave@example.com',
      password: 'password123',
    });
    expect(result.user.id).toBeDefined();
    expect(result.user.email).toBe('dave@example.com');
    expect(result.user.name).toBe('Dave');
  });

  it('rejects a duplicate email', async () => {
    await register({
      name: 'Erin',
      email: 'erin@example.com',
      password: 'password123',
    });
    await expect(
      register({
        name: 'Erin',
        email: 'erin@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('login', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('logs in with valid credentials and returns tokens', async () => {
    await register({
      name: 'Frank',
      email: 'frank@example.com',
      password: 'password123',
    });
    const result = await login({
      email: 'frank@example.com',
      password: 'password123',
    });
    expect(result.accessToken).toBeTypeOf('string');
    expect(result.refreshToken).toBeTypeOf('string');
    expect(result.refreshExpiresAt).toBeInstanceOf(Date);
    expect(result.user.email).toBe('frank@example.com');
    expect(result.user.name).toBe('Frank');
  });

  it('rejects an unknown user', async () => {
    await expect(
      login({ email: 'ghost@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a wrong password', async () => {
    await register({
      name: 'Grace',
      email: 'grace@example.com',
      password: 'password123',
    });
    await expect(
      login({ email: 'grace@example.com', password: 'wrongpass' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
