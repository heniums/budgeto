import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { WalletList } from './WalletList';

import type * as AuthModule from '../api/auth';
import type * as WalletModule from '../api/wallets';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallets: vi.fn(),
    deleteWallet: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getWallets, deleteWallet } from '../api/wallets';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderList(): void {
  window.localStorage.setItem('budgeto.token', 'tok');
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account/wallets']}>
        <Routes>
          <Route path="/account/wallets" element={<WalletList />} />
          <Route path="/account/wallets/new" element={<div>Create Wallet</div>} />
          <Route
            path="/account/wallets/:id"
            element={<div>Wallet Detail</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('WalletList page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getWallets).mockResolvedValue({
      wallets: [
        {
          id: 'w1',
          name: 'Cash',
          description: '',
          color: '#1f8a4c',
          balance: '150.00',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'w2',
          name: 'Savings',
          description: 'Long term',
          color: '#2f6fed',
          balance: '0',
          createdAt: '',
          updatedAt: '',
        },
      ],
    });
    vi.mocked(deleteWallet).mockResolvedValue(undefined);
    window.localStorage.clear();
    cleanup();
  });

  it('renders the page heading', async () => {
    renderList();
    expect(await screen.findByText('Wallets')).toBeInTheDocument();
  });

  it('lists wallets with their balances', async () => {
    renderList();
    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('150.00')).toBeInTheDocument();
  });

  it('navigates to create wallet page', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Wallets');
    await user.click(screen.getByRole('link', { name: /new wallet/i }));
    expect(screen.getByText('Create Wallet')).toBeInTheDocument();
  });

  it('deletes an empty wallet after confirmation', async () => {
    const user = userEvent.setup();

    window.confirm = vi.fn(() => true);

    renderList();
    await screen.findByText('Savings');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[1]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(vi.mocked(deleteWallet)).toHaveBeenCalledWith('tok', 'w2');
    });
  });
});
