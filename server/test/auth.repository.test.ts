import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUser,
  findUserByEmail,
  findUserById,
  deleteAllUsers,
} from '../src/auth/repository';
import { hashPassword } from '../src/auth/password';

describe('user repository', () => {
  beforeEach(async () => {
    await deleteAllUsers();
  });

  it('creates a user and reads it back by email', async () => {
    const passwordHash = await hashPassword('supersecret');
    const created = await createUser({
      email: 'alice@example.com',
      passwordHash,
    });
    expect(created.id).toBeDefined();
    expect(created.email).toBe('alice@example.com');

    const found = await findUserByEmail('alice@example.com');
    expect(found?.id).toBe(created.id);
  });

  it('returns undefined for an unknown email', async () => {
    const found = await findUserByEmail('missing@example.com');
    expect(found).toBeUndefined();
  });

  it('finds a user by id', async () => {
    const created = await createUser({
      email: 'bob@example.com',
      passwordHash: await hashPassword('anotherpass'),
    });
    const found = await findUserById(created.id);
    expect(found?.email).toBe('bob@example.com');
  });

  it('deletes all users', async () => {
    await createUser({
      email: 'carol@example.com',
      passwordHash: await hashPassword('yetanother'),
    });
    await deleteAllUsers();
    const found = await findUserByEmail('carol@example.com');
    expect(found).toBeUndefined();
  });
});
