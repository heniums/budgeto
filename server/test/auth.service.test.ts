import { describe, it, expect, beforeEach } from 'vitest';
import { register, login } from '../src/auth/service';
import { DUMMY_HASH, SALT_ROUNDS } from '../src/auth/password';
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

describe('DUMMY_HASH', () => {
  // Timing equalization depends on the pad hash costing the same as a real
  // stored hash; pin it so raising SALT_ROUNDS alone can't silently desync.
  it('uses the same bcrypt cost factor as SALT_ROUNDS', () => {
    // $2a$10$... → ['', '2a', '10', salt+checksum]
    const cost = Number(DUMMY_HASH.split('$')[2]);
    expect(cost).toBe(SALT_ROUNDS);
  });
});
