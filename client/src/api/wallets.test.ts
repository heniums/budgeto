import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createWallet,
  getWallets,
  getWallet,
  updateWallet,
  deleteWallet,
  createTransaction,
  getTransactions,
  transferFunds,
} from './wallets';
import { ApiError } from './auth';

const TOKEN = 'test-token';

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

describe('wallets API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('createWallet sends POST and returns wallet', async () => {
    mockFetch({
      id: 'w1',
      name: 'Savings',
      balance: '0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });
    const wallet = await createWallet(TOKEN, { name: 'Savings' });
    expect(wallet.name).toBe('Savings');
    expect(wallet.id).toBe('w1');
  });

  it('getWallets sends GET and returns wallet list', async () => {
    mockFetch({ wallets: [{ id: 'w1', name: 'Cash', balance: '100.00' }] });
    const result = await getWallets(TOKEN);
    expect(result.wallets).toHaveLength(1);
    expect(result.wallets[0].name).toBe('Cash');
  });

  it('getWallet sends GET for single wallet', async () => {
    mockFetch({ id: 'w1', name: 'Cash', balance: '50.00' });
    const wallet = await getWallet(TOKEN, 'w1');
    expect(wallet.name).toBe('Cash');
    expect(wallet.balance).toBe('50.00');
  });

  it('updateWallet sends PUT with changes', async () => {
    mockFetch({ id: 'w1', name: 'Updated', balance: '0' });
    const wallet = await updateWallet(TOKEN, 'w1', { name: 'Updated' });
    expect(wallet.name).toBe('Updated');
  });

  it('deleteWallet sends DELETE and resolves on 204', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 204,
      headers: { get: () => 'application/json' },
      json: async () => null,
    }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(deleteWallet(TOKEN, 'w1')).resolves.toBeUndefined();
    expect(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].method,
    ).toBe('DELETE');
  });

  it('createTransaction sends POST', async () => {
    mockFetch({
      id: 't1',
      walletId: 'w1',
      amount: '50.00',
      description: 'Groceries',
      createdAt: '2024-01-01',
    });
    const tx = await createTransaction(TOKEN, 'w1', {
      amount: '50.00',
      description: 'Groceries',
    });
    expect(tx.amount).toBe('50.00');
    expect(tx.walletId).toBe('w1');
  });

  it('getTransactions sends GET', async () => {
    mockFetch({
      transactions: [
        { id: 't1', walletId: 'w1', amount: '50.00', description: 'Test' },
      ],
    });
    const result = await getTransactions(TOKEN, 'w1');
    expect(result.transactions).toHaveLength(1);
  });

  it('transferFunds sends POST with transfer details', async () => {
    mockFetch({
      sourceTransaction: {
        id: 't1',
        walletId: 'w1',
        amount: '-25.00',
        description: 'Transfer',
      },
      targetTransaction: {
        id: 't2',
        walletId: 'w2',
        amount: '25.00',
        description: 'Transfer',
      },
    });
    const result = await transferFunds(TOKEN, {
      sourceId: 'w1',
      targetId: 'w2',
      amount: '25.00',
    });
    expect(result.sourceTransaction.amount).toBe('-25.00');
    expect(result.targetTransaction.amount).toBe('25.00');
  });

  it('throws ApiError on errors', async () => {
    mockFetch({ message: 'Not found', code: 'NOT_FOUND' }, 404);
    await expect(getWallet(TOKEN, 'bad-id')).rejects.toBeInstanceOf(ApiError);
    await expect(getWallet(TOKEN, 'bad-id')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
