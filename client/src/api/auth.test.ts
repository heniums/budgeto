import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPost, mockGet, mockPatch } = vi.hoisted(() => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  const mockPatch = vi.fn();
  return { mockPost, mockGet, mockPatch };
});

vi.mock('./client', () => ({
  default: {
    post: mockPost,
    get: mockGet,
    patch: mockPatch,
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

import { register, login, getMe, updateName, changePassword } from './auth';
import { ApiError } from './client';

describe('auth API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register posts credentials and returns the user', async () => {
    mockPost.mockResolvedValue({ data: { id: 'u1', email: 'a@b.co', name: 'A' } });
    const input = { name: 'A', email: 'a@b.co', password: 'password123' };
    const user = await register(input);
    expect(mockPost).toHaveBeenCalledWith('/auth/register', input);
    expect(user).toEqual({ id: 'u1', email: 'a@b.co', name: 'A' });
  });

  it('login posts credentials and returns the user', async () => {
    mockPost.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.co', name: 'A' } },
    });
    const input = { email: 'a@b.co', password: 'password123' };
    const result = await login(input);
    expect(mockPost).toHaveBeenCalledWith('/auth/login', input);
    expect(result.user.email).toBe('a@b.co');
  });

  it('getMe sends GET', async () => {
    mockGet.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.co', name: 'A' } },
    });
    const user = await getMe();
    expect(mockGet).toHaveBeenCalledWith('/auth/me');
    expect(user.name).toBe('A');
  });

  it('updateName sends PATCH with the new name', async () => {
    mockPatch.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.co', name: 'New' } },
    });
    const user = await updateName('New');
    expect(mockPatch).toHaveBeenCalledWith('/auth/me', { name: 'New' });
    expect(user.name).toBe('New');
  });

  it('changePassword sends POST and resolves on success', async () => {
    mockPost.mockResolvedValue({ data: undefined });
    await expect(
      changePassword({ currentPassword: 'a', newPassword: 'b' }),
    ).resolves.toBeUndefined();
    expect(mockPost).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'a',
      newPassword: 'b',
    });
  });

  it('throws an ApiError on failure', async () => {
    const apiError = new ApiError('Invalid credentials', 401, 'UNAUTHORIZED');
    mockPost.mockRejectedValue(apiError);
    await expect(login({ email: 'a@b.co', password: 'x' })).rejects.toBeInstanceOf(ApiError);
    await expect(login({ email: 'a@b.co', password: 'x' })).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });
});
