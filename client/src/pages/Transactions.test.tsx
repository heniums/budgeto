import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Transactions } from './Transactions';

import type * as AuthModule from '../api/auth';
import type * as WalletModule from '../api/wallets';
import type * as TransactionsModule from '../api/transactions';
import type * as CategoryModule from '../api/categories';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return { ...actual, getWallet: vi.fn() };
});

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TransactionsModule>();
  return { ...actual, getTransactions: vi.fn() };
});

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CategoryModule>();
  return { ...actual, getCategories: vi.fn() };
});

import { getMe } from '../api/auth';
import { getWallet } from '../api/wallets';
import { getTransactions } from '../api/transactions';
import { getCategories } from '../api/categories';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderTransactions(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account/wallets/w1/transactions']}>
        <Routes>
          <Route
            path="/account/wallets/:id/transactions"
            element={<Transactions />}
          />
          <Route
            path="/account/wallets/:id"
            element={<div>Wallet Detail</div>}
          />
          <Route
            path="/account/wallets/:id/transactions/new"
            element={<div>New Transaction</div>}
          />
          <Route
            path="/account/wallets/:id/transfer"
            element={<div>Transfer</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Transactions page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getWallet).mockResolvedValue({
      id: 'w1',
      name: 'Cash',
      description: 'Daily expenses',
      color: '#1f8a4c',
      balance: '75.50',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    });
    vi.mocked(getTransactions).mockResolvedValue({
      transactions: [
        {
          id: 't1',
          walletId: 'w1',
          amount: '100.00',
          description: 'Deposit',
          categoryId: 'c1',
          createdAt: '2024-01-03',
        },
        {
          id: 't2',
          walletId: 'w1',
          amount: '-24.50',
          description: 'Expense',
          categoryId: null,
          createdAt: '2024-01-02',
        },
      ],
    });
    vi.mocked(getCategories).mockResolvedValue({
      categories: [
        {
          id: 'c1',
          userId: 'u1',
          name: 'Food',
          type: 'expense',
          color: '#ff0000',
          icon: 'Tag',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      ],
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders wallet name and balance', async () => {
    renderTransactions();
    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('75.50')).toBeInTheDocument();
  });

  it('lists transactions for the wallet', async () => {
    renderTransactions();
    expect(await screen.findByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('-24.50')).toBeInTheDocument();
  });

  it('shows the category name for a transaction', async () => {
    renderTransactions();
    expect(await screen.findByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows an empty state when there are no transactions', async () => {
    vi.mocked(getTransactions).mockResolvedValue({ transactions: [] });
    renderTransactions();
    expect(await screen.findByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it('links to the new transaction page', async () => {
    const user = userEvent.setup();
    renderTransactions();
    await screen.findByText('Cash');
    await user.click(screen.getByRole('link', { name: /add transaction/i }));
    expect(screen.getByText('New Transaction')).toBeInTheDocument();
  });

  it('links to the transfer page', async () => {
    const user = userEvent.setup();
    renderTransactions();
    await screen.findByText('Cash');
    await user.click(screen.getByRole('link', { name: /transfer/i }));
    expect(screen.getByText('Transfer')).toBeInTheDocument();
  });

  it('navigates back to the wallet detail', async () => {
    const user = userEvent.setup();
    renderTransactions();
    await screen.findByText('Cash');
    await user.click(screen.getByRole('link', { name: /back/i }));
    expect(screen.getByText('Wallet Detail')).toBeInTheDocument();
  });
});
