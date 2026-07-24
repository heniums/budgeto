import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPost, mockGet, mockPut, mockDelete } = vi.hoisted(() => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  return { mockPost, mockGet, mockPut, mockDelete };
});

vi.mock('./client', () => ({
  apiClient: {
    post: mockPost,
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
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

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from './categories';
import { ApiError } from './client';

const sampleCategory = {
  id: 'cat1',
  userId: 'u1',
  name: 'Food',
  color: '#ff0000',
  icon: '🍔',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('categories API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createCategory posts input and returns the category', async () => {
    mockPost.mockResolvedValue({ data: sampleCategory });
    const input = { name: 'Food', color: '#ff0000', icon: '🍔' };
    const category = await createCategory(input);
    expect(mockPost).toHaveBeenCalledWith('/categories', input);
    expect(category).toEqual(sampleCategory);
  });

  it('getCategories sends GET and returns the list', async () => {
    mockGet.mockResolvedValue({ data: { categories: [sampleCategory] } });
    const result = await getCategories();
    expect(mockGet).toHaveBeenCalledWith('/categories');
    expect(result).toEqual({ categories: [sampleCategory] });
  });

  it('getCategory sends GET with id and returns the category', async () => {
    mockGet.mockResolvedValue({ data: sampleCategory });
    const category = await getCategory('cat1');
    expect(mockGet).toHaveBeenCalledWith('/categories/cat1');
    expect(category).toEqual(sampleCategory);
  });

  it('updateCategory sends PUT with id and input and returns updated category', async () => {
    const updated = { ...sampleCategory, name: 'Groceries' };
    mockPut.mockResolvedValue({ data: updated });
    const input = { name: 'Groceries' };
    const category = await updateCategory('cat1', input);
    expect(mockPut).toHaveBeenCalledWith('/categories/cat1', input);
    expect(category).toEqual(updated);
  });

  it('deleteCategory sends DELETE and resolves void', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await expect(deleteCategory('cat1')).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalledWith('/categories/cat1');
  });

  it('rejects with ApiError and preserves status/code', async () => {
    const apiError = new ApiError('Not found', 404, 'NOT_FOUND');
    mockGet.mockRejectedValue(apiError);
    await expect(getCategory('missing')).rejects.toBeInstanceOf(ApiError);
    await expect(getCategory('missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Not found',
    });
  });

  it('createCategory rejects with ApiError on failure', async () => {
    const apiError = new ApiError('Bad request', 400, 'VALIDATION_ERROR');
    mockPost.mockRejectedValue(apiError);
    await expect(
      createCategory({ name: '', color: '', icon: '' }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      createCategory({ name: '', color: '', icon: '' }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
});
