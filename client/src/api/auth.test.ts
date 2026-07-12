import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  register,
  login,
  getMe,
  updateName,
  changePassword,
  ApiError,
} from './auth';

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => 'application/json' },
      json: async () => body,
    })),
  );
}

describe('auth API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('register posts credentials and returns the user', async () => {
    mockFetch({ id: 'u1', email: 'a@b.co', name: 'A' });
    const user = await register({
      name: 'A',
      email: 'a@b.co',
      password: 'password123',
    });
    expect(user).toEqual({ id: 'u1', email: 'a@b.co', name: 'A' });
  });

  it('login posts credentials and returns a token', async () => {
    mockFetch({ token: 'tkn', user: { id: 'u1', email: 'a@b.co', name: 'A' } });
    const result = await login({ email: 'a@b.co', password: 'password123' });
    expect(result.token).toBe('tkn');
    expect(result.user.email).toBe('a@b.co');
  });

  it('getMe sends the bearer token and returns the user', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ user: { id: 'u1', email: 'a@b.co', name: 'A' } }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const user = await getMe('tkn');
    expect(user.name).toBe('A');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tkn');
  });

  it('updateName sends a PATCH with the new name', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ user: { id: 'u1', email: 'a@b.co', name: 'New' } }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const user = await updateName('tkn', 'New');
    expect(user.name).toBe('New');
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
  });

  it('changePassword sends a POST and resolves on 204', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 204,
      headers: { get: () => 'application/json' },
      json: async () => null,
    }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      changePassword('tkn', { currentPassword: 'a', newPassword: 'b' }),
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('throws an ApiError on failure status', async () => {
    mockFetch({ message: 'Invalid credentials', code: 'UNAUTHORIZED' }, 401);
    await expect(login({ email: 'a@b.co', password: 'x' })).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    await expect(login({ email: 'a@b.co', password: 'x' })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
