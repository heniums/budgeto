import { describe, it, expect, beforeEach } from 'vitest';
import { register, login } from '../src/auth/service';
import { deleteAllUsers } from '../src/auth/repository';

describe('register', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('registers a new user', async () => {
    const result = await register({
      email: 'dave@example.com',
      password: 'password123',
    });
    expect(result.id).toBeDefined();
    expect(result.email).toBe('dave@example.com');
  });

  it('rejects a duplicate email', async () => {
    await register({
      email: 'erin@example.com',
      password: 'password123',
    });
    await expect(
      register({
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

  it('logs in with valid credentials and returns a token', async () => {
    await register({
      email: 'frank@example.com',
      password: 'password123',
    });
    const result = await login({
      email: 'frank@example.com',
      password: 'password123',
    });
    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('frank@example.com');
  });

  it('rejects an unknown user', async () => {
    await expect(
      login({ email: 'ghost@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a wrong password', async () => {
    await register({
      email: 'grace@example.com',
      password: 'password123',
    });
    await expect(
      login({ email: 'grace@example.com', password: 'wrongpass' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
