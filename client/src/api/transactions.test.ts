import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPut, mockDelete } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  return { mockGet, mockPut, mockDelete };
});

vi.mock('./client', () => ({
  apiClient: {
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
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from './transactions';
import { ApiError } from './client';

describe('transactions API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTransactions sends GET with no params (backward compatible)', async () => {
    mockGet.mockResolvedValue({
      data: {
        transactions: [
          {
            id: 't1',
            walletId: 'w1',
            amount: '50.00',
            description: 'Groceries',
            categoryId: 'c1',
            categoryName: 'Food',
            createdAt: '2024-01-01',
          },
        ],
        total: 1,
      },
    });
    const result = await getTransactions();
    expect(mockGet).toHaveBeenCalledWith('/transactions');
    expect(result.transactions).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.transactions[0].categoryId).toBe('c1');
    expect(result.transactions[0].categoryName).toBe('Food');
  });

  it('getTransactions serializes filter params', async () => {
    mockGet.mockResolvedValue({
      data: { transactions: [], total: 0 },
    });
    await getTransactions({
      walletId: 'w1',
      categoryId: 'c1',
      type: 'expense',
      search: 'foo',
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-12-31T23:59:59.999Z',
      limit: 20,
      offset: 40,
    });
    expect(mockGet).toHaveBeenCalledWith('/transactions', {
      params: {
        walletId: 'w1',
        categoryId: 'c1',
        type: 'expense',
        search: 'foo',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
        limit: 20,
        offset: 40,
      },
    });
  });

  it('getTransactions omits the type filter when set to all', async () => {
    mockGet.mockResolvedValue({
      data: { transactions: [], total: 0 },
    });
    await getTransactions({ type: 'all', walletId: 'w1' });
    expect(mockGet).toHaveBeenCalledWith('/transactions', {
      params: { walletId: 'w1' },
    });
  });

  it('getTransaction sends GET for a single transaction', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Groceries',
        createdAt: '2024-01-01',
      },
    });
    const tx = await getTransaction('t1');
    expect(mockGet).toHaveBeenCalledWith('/transactions/t1');
    expect(tx.amount).toBe('50.00');
  });

  it('throws ApiError on errors', async () => {
    const apiError = new ApiError('Not found', 404, 'NOT_FOUND');
    mockGet.mockRejectedValue(apiError);
    await expect(getTransactions()).rejects.toBeInstanceOf(ApiError);
    await expect(getTransactions()).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('updateTransaction sends PUT with partial fields', async () => {
    mockPut.mockResolvedValue({
      data: {
        id: 't1',
        walletId: 'w1',
        amount: '200.00',
        description: 'Updated',
        categoryId: null,
        createdAt: '2024-01-01',
      },
    });
    const result = await updateTransaction('t1', {
      amount: '200',
      description: 'Updated',
    });
    expect(mockPut).toHaveBeenCalledWith('/transactions/t1', {
      amount: '200',
      description: 'Updated',
    });
    expect(result.amount).toBe('200.00');
    expect(result.description).toBe('Updated');
  });

  it('deleteTransaction sends DELETE and returns the deleted resource', async () => {
    mockDelete.mockResolvedValue({
      data: {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Deleted',
        categoryId: null,
        createdAt: '2024-01-01',
      },
    });
    const result = await deleteTransaction('t1');
    expect(mockDelete).toHaveBeenCalledWith('/transactions/t1');
    expect(result.id).toBe('t1');
  });
});
