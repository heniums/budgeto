import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
  };
});

import { getMe } from '../api/auth';
import { getWallets } from '../api/wallets';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderList(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/settings']}>
        <WalletList />
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

  it('opens WalletModal in create mode when clicking New Wallet', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Wallets');
    await user.click(screen.getByRole('button', { name: /new wallet/i }));

    await waitFor(() => {
      const titles = screen.getAllByText('New Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('opens WalletModal in view mode when clicking a wallet name', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cash');
    await user.click(screen.getByText('Cash'));

    await waitFor(() => {
      const titles = screen.getAllByText('Wallet Details');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });
});
