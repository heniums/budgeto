import { describe, it, expect } from 'vitest';
import { findTransferPair } from './transferPair';
import type { TransactionData } from '../api/transactions';

function makeTx(
  overrides: Partial<TransactionData> = {},
): TransactionData {
  return {
    id: 't1',
    walletId: 'w1',
    amount: '50.00',
    description: 'Transfer',
    categoryId: null,
    categoryName: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('findTransferPair', () => {
  it('returns null for a standalone transaction', () => {
    const tx = makeTx({ id: 't1', description: 'Groceries' });
    const result = findTransferPair(tx, [tx]);
    expect(result).toBeNull();
  });

  it('returns null when no transaction has matching description', () => {
    const tx = makeTx({ id: 't1', description: 'Transfer' });
    const other = makeTx({
      id: 't2',
      description: 'Something else',
      amount: '-50.00',
    });
    const result = findTransferPair(tx, [tx, other]);
    expect(result).toBeNull();
  });

  it('returns null when amounts have same sign', () => {
    const tx = makeTx({ id: 't1', description: 'Transfer', amount: '50.00' });
    const other = makeTx({
      id: 't2',
      description: 'Transfer',
      amount: '50.00',
    });
    const result = findTransferPair(tx, [tx, other]);
    expect(result).toBeNull();
  });

  it('returns null when timestamps are too far apart', () => {
    const tx = makeTx({
      id: 't1',
      description: 'Transfer',
      amount: '50.00',
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    const other = makeTx({
      id: 't2',
      description: 'Transfer',
      amount: '-50.00',
      createdAt: '2026-01-01T10:00:05.000Z', // 5 seconds apart
    });
    const result = findTransferPair(tx, [tx, other]);
    expect(result).toBeNull();
  });

  it('finds the paired transfer leg', () => {
    const tx = makeTx({
      id: 't1',
      description: 'Transfer',
      amount: '50.00',
      createdAt: '2026-01-01T10:00:00.000Z',
    });
    const other = makeTx({
      id: 't2',
      description: 'Transfer',
      amount: '-50.00',
      createdAt: '2026-01-01T10:00:00.500Z',
    });
    const result = findTransferPair(tx, [tx, other]);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('t2');
  });

  it('returns null when description is empty', () => {
    const tx = makeTx({ id: 't1', description: '', amount: '50.00' });
    const other = makeTx({ id: 't2', description: '', amount: '-50.00' });
    const result = findTransferPair(tx, [tx, other]);
    expect(result).toBeNull();
  });

  it('ignores self when searching', () => {
    const tx = makeTx({
      id: 't1',
      description: 'Transfer',
      amount: '50.00',
    });
    // Only self in the list
    const result = findTransferPair(tx, [tx]);
    expect(result).toBeNull();
  });
});
