import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/auth/service';
import { ConflictError, UnauthorizedError } from '../src/errors';
import { UserRepository } from '../src/auth/repository';

const service = new AuthService();
const repository = new UserRepository();

describe('AuthService.register', () => {
  beforeEach(async () => {
    await repository.deleteAll();
  });

  it('registers a new user', async () => {
    const result = await service.register({
      email: 'dave@example.com',
      password: 'password123',
    });
    expect(result.id).toBeDefined();
    expect(result.email).toBe('dave@example.com');
  });

  it('rejects a duplicate email', async () => {
    await service.register({
      email: 'erin@example.com',
      password: 'password123',
    });
    await expect(
      service.register({
        email: 'erin@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('AuthService.login', () => {
  beforeEach(async () => {
    await repository.deleteAll();
  });

  it('logs in with valid credentials and returns a token', async () => {
    await service.register({
      email: 'frank@example.com',
      password: 'password123',
    });
    const result = await service.login({
      email: 'frank@example.com',
      password: 'password123',
    });
    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('frank@example.com');
  });

  it('rejects an unknown user', async () => {
    await expect(
      service.login({ email: 'ghost@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a wrong password', async () => {
    await service.register({
      email: 'grace@example.com',
      password: 'password123',
    });
    await expect(
      service.login({ email: 'grace@example.com', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
