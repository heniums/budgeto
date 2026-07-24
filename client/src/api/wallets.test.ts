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
  createWallet,
  getWallets,
  getWallet,
  updateWallet,
  deleteWallet,
  adjustBalance,
  createTransaction,
  transferFunds,
} from './wallets';
import { ApiError } from './client';

describe('wallets API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createWallet sends POST and returns wallet', async () => {
    mockPost.mockResolvedValue({
      data: {
        id: 'w1',
        name: 'Savings',
        currency: 'USD',
        balance: '0',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });
    const wallet = await createWallet({ name: 'Savings', balance: '100.00' });
    expect(mockPost).toHaveBeenCalledWith('/wallets', { name: 'Savings', balance: '100.00' });
    expect(wallet.name).toBe('Savings');
    expect(wallet.id).toBe('w1');
  });

  it('getWallets sends GET and returns wallet list', async () => {
    mockGet.mockResolvedValue({
      data: {
        wallets: [
          { id: 'w1', name: 'Cash', currency: 'USD', balance: '100.00' },
        ],
      },
    });
    const result = await getWallets();
    expect(mockGet).toHaveBeenCalledWith('/wallets');
    expect(result.wallets).toHaveLength(1);
    expect(result.wallets[0].name).toBe('Cash');
  });

  it('getWallet sends GET for single wallet', async () => {
    mockGet.mockResolvedValue({
      data: { id: 'w1', name: 'Cash', currency: 'USD', balance: '50.00' },
    });
    const wallet = await getWallet('w1');
    expect(mockGet).toHaveBeenCalledWith('/wallets/w1');
    expect(wallet.name).toBe('Cash');
    expect(wallet.balance).toBe('50.00');
  });

  it('updateWallet sends PUT with changes', async () => {
    mockPut.mockResolvedValue({
      data: { id: 'w1', name: 'Updated', currency: 'USD', balance: '0' },
    });
    const wallet = await updateWallet('w1', { name: 'Updated', balance: '50.00' });
    expect(mockPut).toHaveBeenCalledWith('/wallets/w1', { name: 'Updated', balance: '50.00' });
    expect(wallet.name).toBe('Updated');
  });

  it('deleteWallet sends DELETE and resolves on 204', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await expect(deleteWallet('w1')).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalledWith('/wallets/w1');
  });

  it('adjustBalance sends POST to /wallets/:id/adjust and returns wallet', async () => {
    mockPost.mockResolvedValue({
      data: {
        id: 'w1',
        name: 'Cash',
        description: '',
        color: '#1f8a4c',
        currency: 'USD',
        balance: '200.00',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });
    const wallet = await adjustBalance('w1', { targetBalance: '200.00' });
    expect(mockPost).toHaveBeenCalledWith('/wallets/w1/adjust', {
      targetBalance: '200.00',
    });
    expect(wallet.balance).toBe('200.00');
  });

  it('throws ApiError on adjustBalance errors', async () => {
    const apiError = new ApiError('Bad request', 400, 'VALIDATION_ERROR');
    mockPost.mockRejectedValue(apiError);
    await expect(
      adjustBalance('w1', { targetBalance: 'bad' }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      adjustBalance('w1', { targetBalance: 'bad' }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('throws ApiError on errors', async () => {
    const apiError = new ApiError('Not found', 404, 'NOT_FOUND');
    mockGet.mockRejectedValue(apiError);
    await expect(getWallet('bad-id')).rejects.toBeInstanceOf(ApiError);
    await expect(getWallet('bad-id')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('createTransaction sends POST to /wallets/:id/transactions and returns transaction', async () => {
    const transaction = {
      id: 't1',
      walletId: 'w1',
      amount: '-50.00',
      description: 'Groceries',
      categoryId: 'c1',
      date: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
    };
    mockPost.mockResolvedValue({ data: transaction });
    const result = await createTransaction('w1', {
      amount: '-50.00',
      description: 'Groceries',
      categoryId: 'c1',
      date: '2024-01-15',
    });
    expect(mockPost).toHaveBeenCalledWith('/wallets/w1/transactions', {
      amount: '-50.00',
      description: 'Groceries',
      categoryId: 'c1',
      date: '2024-01-15',
    });
    expect(result).toEqual(transaction);
    expect(result.id).toBe('t1');
    expect(result.walletId).toBe('w1');
  });

  it('transferFunds sends POST to /wallets/transfer and returns both transactions', async () => {
    const sourceTransaction = {
      id: 't1',
      walletId: 'w1',
      amount: '-100.00',
      description: 'Transfer',
      categoryId: null,
      date: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
    };
    const targetTransaction = {
      id: 't2',
      walletId: 'w2',
      amount: '100.00',
      description: 'Transfer',
      categoryId: null,
      date: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
    };
    mockPost.mockResolvedValue({
      data: { sourceTransaction, targetTransaction },
    });
    const result = await transferFunds({
      sourceId: 'w1',
      targetId: 'w2',
      amount: '100.00',
      description: 'Transfer',
    });
    expect(mockPost).toHaveBeenCalledWith('/wallets/transfer', {
      sourceId: 'w1',
      targetId: 'w2',
      amount: '100.00',
      description: 'Transfer',
    });
    expect(result).toEqual({ sourceTransaction, targetTransaction });
    expect(result.sourceTransaction.walletId).toBe('w1');
    expect(result.targetTransaction.walletId).toBe('w2');
  });

  it('throws ApiError on transferFunds errors', async () => {
    const apiError = new ApiError(
      'Insufficient funds',
      400,
      'INSUFFICIENT_FUNDS',
    );
    mockPost.mockRejectedValue(apiError);
    await expect(
      transferFunds({
        sourceId: 'w1',
        targetId: 'w2',
        amount: '1000.00',
      }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      transferFunds({
        sourceId: 'w1',
        targetId: 'w2',
        amount: '1000.00',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'INSUFFICIENT_FUNDS',
    });
  });
});
