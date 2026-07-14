import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => {
  const mockGet = vi.fn();
  return { mockGet };
});

vi.mock('./client', () => ({
  apiClient: {
    get: mockGet,
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

import { getTransactions, getTransaction } from './transactions';
import { ApiError } from './client';

describe('transactions API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTransactions sends GET and returns the user-scoped list', async () => {
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
});
