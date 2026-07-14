import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { WalletDetail } from './WalletDetail';

import type * as AuthModule from '../api/auth';
import type * as WalletModule from '../api/wallets';
import type * as TransactionsModule from '../api/transactions';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallet: vi.fn(),
  };
});

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TransactionsModule>();
  return {
    ...actual,
    getTransactions: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getWallet } from '../api/wallets';
import { getTransactions } from '../api/transactions';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderDetail(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/settings/wallets/w1']}>
        <Routes>
          <Route path="/settings/wallets/:id" element={<WalletDetail />} />
          <Route
            path="/settings/wallets/:id/edit"
            element={<div>Edit Wallet</div>}
          />
          <Route path="/settings/wallets" element={<div>Wallet List</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('WalletDetail page', () => {
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
          createdAt: '2024-01-03',
        },
        {
          id: 't2',
          walletId: 'w1',
          amount: '-24.50',
          description: 'Expense',
          createdAt: '2024-01-02',
        },
      ],
      total: 2,
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders wallet name and balance', async () => {
    renderDetail();
    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('75.50')).toBeInTheDocument();
  });

  it('renders wallet description', async () => {
    renderDetail();
    expect(await screen.findByText('Daily expenses')).toBeInTheDocument();
  });

  it('lists transaction history', async () => {
    renderDetail();
    expect(await screen.findByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('-24.50')).toBeInTheDocument();
  });

  it('links to edit wallet page', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText('Cash');
    await user.click(screen.getByRole('link', { name: /edit/i }));
    expect(screen.getByText('Edit Wallet')).toBeInTheDocument();
  });

  it('navigates back to wallet list', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText('Cash');
    await user.click(screen.getByRole('link', { name: /back/i }));
    expect(screen.getByText('Wallet List')).toBeInTheDocument();
  });
});
