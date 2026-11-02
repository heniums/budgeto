import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { WalletList } from './WalletList';

import type * as AuthModule from '../api/auth';
import type * as WalletModule from '../api/wallets';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, refreshSession: vi.fn() };
});

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallets: vi.fn(),
    getWallet: vi.fn(),
  };
});

import { refreshSession } from '../api/auth';
import { getWallets, getWallet } from '../api/wallets';

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
    currency: 'EUR',
    balance: '0',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '',
  },
];

// WalletModal fetches the opened wallet by id (row clicks deep-link).
vi.mocked(getWallet).mockImplementation(async (id) => {
  const wallet = mockWallets.find((w) => w.id === id);
  if (!wallet) {
    throw new Error(`Wallet ${id} not found`);
  }
  return wallet;
});

function renderList(initialEntry = '/wallets'): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <QueryClientProvider client={createTestQueryClient()}>
          <WalletList />
        </QueryClientProvider>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('WalletList page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockResolvedValue({
      user: mockUser,
      accessToken: 'tok',
    });
    vi.mocked(getWallets).mockResolvedValue({ wallets: mockWallets });
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
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('€0.00')).toBeInTheDocument();
  });

  it('displays each wallet currency in the table', async () => {
    renderList();
    await screen.findByText('Cash');
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('shows empty state when no wallets exist', async () => {
    vi.mocked(getWallets).mockResolvedValue({ wallets: [] });
    renderList();
    expect(await screen.findByText('No wallets yet.')).toBeInTheDocument();
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
    // data-testid is more stable than getAllByRole(...)[0] which depends on DOM order
    await user.click(screen.getByTestId('header-add-button'));

    await waitFor(() => {
      const titles = screen.getAllByText('New Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('opens WalletModal in edit mode when clicking a wallet name', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cash');
    await user.click(screen.getByText('Cash'));

    await waitFor(() => {
      const titles = screen.getAllByText('Edit Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('wraps the table in an overflow-hidden container for mobile', async () => {
    renderList();
    await screen.findByText('Cash');
    const table = screen.getByText('Cash').closest('table');
    expect(table?.parentElement).toHaveClass('memphis-card');
    expect(table?.parentElement).toHaveClass('overflow-hidden');
  });

  it('opens WalletModal in create mode when clicking the FAB', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Wallets');

    // Click the FAB (second button with "New Wallet" name)
    const buttons = screen.getAllByRole('button', { name: /new wallet/i });
    await user.click(buttons[1]); // [1] is the FAB

    await waitFor(() => {
      const titles = screen.getAllByText('New Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('opens the edit modal for a deep-linked wallet', async () => {
    renderList('/wallets?wallet=w1');

    await waitFor(() => {
      expect(vi.mocked(getWallet)).toHaveBeenCalledWith('w1');
    });
    await waitFor(() => {
      const titles = screen.getAllByText('Edit Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
    // The form loads the deep-linked wallet's data.
    expect(await screen.findByDisplayValue('Cash')).toBeInTheDocument();
  });

  it('opens the create modal for ?wallet=new', async () => {
    renderList('/wallets?wallet=new');

    await waitFor(() => {
      const titles = screen.getAllByText('New Wallet');
      expect(titles.length).toBeGreaterThanOrEqual(2);
    });
    expect(vi.mocked(getWallet)).not.toHaveBeenCalled();
  });
});
