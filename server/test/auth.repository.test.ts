import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from '../src/auth/repository';
import { hashPassword } from '../src/auth/password';

const repository = new UserRepository();

describe('UserRepository', () => {
  beforeEach(async () => {
    await repository.deleteAll();
  });

  it('creates a user and reads it back by email', async () => {
    const passwordHash = await hashPassword('supersecret');
    const created = await repository.create({
      email: 'alice@example.com',
      passwordHash,
    });
    expect(created.id).toBeDefined();
    expect(created.email).toBe('alice@example.com');

    const found = await repository.findByEmail('alice@example.com');
    expect(found?.id).toBe(created.id);
  });

  it('returns undefined for an unknown email', async () => {
    const found = await repository.findByEmail('missing@example.com');
    expect(found).toBeUndefined();
  });

  it('finds a user by id', async () => {
    const created = await repository.create({
      email: 'bob@example.com',
      passwordHash: await hashPassword('anotherpass'),
    });
    const found = await repository.findById(created.id);
    expect(found?.email).toBe('bob@example.com');
  });

  it('deletes all users', async () => {
    await repository.create({
      email: 'carol@example.com',
      passwordHash: await hashPassword('yetanother'),
    });
    await repository.deleteAll();
    const found = await repository.findByEmail('carol@example.com');
    expect(found).toBeUndefined();
  });
});
