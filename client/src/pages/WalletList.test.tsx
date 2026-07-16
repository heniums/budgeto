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
    deleteWallet: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getWallets, deleteWallet } from '../api/wallets';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

const mockWallets = [
  {
    id: 'w1',
    name: 'Cash',
    description: 'Daily cash',
    color: '#1f8a4c',
    currency: 'USD',
    balance: '150.00',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Savings',
    description: 'Long term',
    color: '#2f6fed',
    currency: 'USD',
    balance: '0',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '',
  },
];

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
    vi.mocked(getWallets).mockResolvedValue({ wallets: mockWallets });
    vi.mocked(deleteWallet).mockResolvedValue(undefined);
    window.localStorage.clear();
    cleanup();
  });

  it('renders the page heading', async () => {
    renderList();
    expect(await screen.findByText('Wallets')).toBeInTheDocument();
  });

  it('lists wallets in a table with name, description, balance, and date', async () => {
    renderList();
    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Daily cash')).toBeInTheDocument();
    expect(screen.getByText('150.00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit Cash' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Cash' }),
    ).toBeInTheDocument();
  });

  it('shows empty state when no wallets exist', async () => {
    vi.mocked(getWallets).mockResolvedValue({ wallets: [] });
    renderList();
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No wallets yet.')).toBeInTheDocument();
  });

  it('filters wallets by name via search input', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cash');

    const searchInput = screen.getByLabelText('Search wallets');
    await user.type(searchInput, 'sav');

    await waitFor(() => {
      expect(screen.queryByText('Cash')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('filters wallets by description via search input', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cash');

    const searchInput = screen.getByLabelText('Search wallets');
    await user.type(searchInput, 'daily');

    await waitFor(() => {
      expect(screen.queryByText('Savings')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('shows no-match message when search yields nothing', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cash');

    const searchInput = screen.getByLabelText('Search wallets');
    await user.type(searchInput, 'zzznotfound');

    expect(
      await screen.findByText('No wallets match your search.'),
    ).toBeInTheDocument();
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
      const titles = screen.getAllByText('Edit Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens WalletModal in edit mode when clicking Edit button', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cash');
    await user.click(screen.getByRole('button', { name: 'Edit Cash' }));

    await waitFor(() => {
      const titles = screen.getAllByText('Edit Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deletes a wallet after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderList();
    await screen.findByText('Cash');

    await user.click(screen.getByRole('button', { name: 'Delete Cash' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteWallet).toHaveBeenCalledWith('w1');
    // After delete, list reloads — verify getWallets was called again
    await waitFor(() => {
      expect(getWallets).toHaveBeenCalledTimes(2); // initial + reload
    });
    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderList();
    await screen.findByText('Cash');

    await user.click(screen.getByRole('button', { name: 'Delete Cash' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteWallet).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
