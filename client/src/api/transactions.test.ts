import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  return { mockGet, mockPost, mockPut, mockDelete };
});

vi.mock('./client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
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
  createTransaction,
  getTransactions,
  transferFunds,
} from './transactions';
import { ApiError } from './client';

describe('transactions API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTransaction sends POST and returns the transaction', async () => {
    mockPost.mockResolvedValue({
      data: {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Groceries',
        categoryId: null,
        createdAt: '2024-01-01',
      },
    });
    const tx = await createTransaction('w1', {
      amount: '50.00',
      description: 'Groceries',
    });
    expect(mockPost).toHaveBeenCalledWith('/wallets/w1/transactions', {
      amount: '50.00',
      description: 'Groceries',
    });
    expect(tx.amount).toBe('50.00');
    expect(tx.walletId).toBe('w1');
  });

  it('getTransactions sends GET and returns the transaction list', async () => {
    mockGet.mockResolvedValue({
      data: {
        transactions: [
          {
            id: 't1',
            walletId: 'w1',
            amount: '50.00',
            description: 'Test',
            categoryId: null,
          },
        ],
      },
    });
    const result = await getTransactions('w1');
    expect(mockGet).toHaveBeenCalledWith('/wallets/w1/transactions');
    expect(result.transactions).toHaveLength(1);
  });

  it('createTransaction sends categoryId when provided', async () => {
    mockPost.mockResolvedValue({
      data: {
        id: 't2',
        walletId: 'w1',
        amount: '10.00',
        description: '',
        categoryId: 'c1',
        createdAt: '2024-01-01',
      },
    });
    const tx = await createTransaction('w1', {
      amount: '10.00',
      categoryId: 'c1',
    });
    expect(mockPost).toHaveBeenCalledWith('/wallets/w1/transactions', {
      amount: '10.00',
      categoryId: 'c1',
    });
    expect(tx.categoryId).toBe('c1');
  });

  it('transferFunds sends POST with transfer details', async () => {
    mockPost.mockResolvedValue({
      data: {
        sourceTransaction: {
          id: 't1',
          walletId: 'w1',
          amount: '-25.00',
          description: 'Transfer',
          createdAt: '',
        },
        targetTransaction: {
          id: 't2',
          walletId: 'w2',
          amount: '25.00',
          description: 'Transfer',
          createdAt: '',
        },
      },
    });
    const result = await transferFunds({
      sourceId: 'w1',
      targetId: 'w2',
      amount: '25.00',
    });
    expect(mockPost).toHaveBeenCalledWith('/wallets/transfer', {
      sourceId: 'w1',
      targetId: 'w2',
      amount: '25.00',
    });
    expect(result.sourceTransaction.amount).toBe('-25.00');
    expect(result.targetTransaction.amount).toBe('25.00');
  });

  it('throws ApiError on errors', async () => {
    const apiError = new ApiError('Not found', 404, 'NOT_FOUND');
    mockPost.mockRejectedValue(apiError);
    await expect(
      createTransaction('w1', { amount: '1' }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      createTransaction('w1', { amount: '1' }),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
