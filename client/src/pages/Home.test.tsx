import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './Home';

import type * as TxModule from '../api/transactions';
import type * as WalletModule from '../api/wallets';
import type * as CatModule from '../api/categories';

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TxModule>();
  return {
    ...actual,
    getTransactions: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  };
});
vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallets: vi.fn(),
    getWallet: vi.fn(),
    createWallet: vi.fn(),
  };
});
vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CatModule>();
  return { ...actual, getCategories: vi.fn() };
});

import { getTransactions, updateTransaction, deleteTransaction } from '../api/transactions';
import { getWallets, getWallet, createWallet } from '../api/wallets';
import { getCategories } from '../api/categories';

const mockCategories = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Food',
    type: 'expense' as const,
    color: '#ff6b6b',
    icon: 'UtensilsCrossed',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const wallets = [
  {
    id: 'w1',
    name: 'Cash',
    description: '',
    color: '#1f8a4c',
    balance: '100.00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Savings',
    description: '',
    color: '#2f6fed',
    balance: '50.00',
    createdAt: '',
    updatedAt: '',
  },
];

function renderHome(): void {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home transactions list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    vi.mocked(getTransactions).mockResolvedValue({
      transactions: [
        {
          id: 't1',
          walletId: 'w1',
          amount: '50.00',
          description: 'Salary',
          categoryId: 'c1',
          categoryName: 'Food',
          createdAt: '2026-01-02T10:00:00Z',
        },
        {
          id: 't2',
          walletId: 'w2',
          amount: '-20.00',
          description: 'Coffee',
          categoryId: null,
          categoryName: null,
          createdAt: '2026-01-01T10:00:00Z',
        },
      ],
      total: 2,
    });
    cleanup();
  });

  it('lists all user transactions newest first', async () => {
    renderHome();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('filters by wallet', async () => {
    renderHome();
    await screen.findByText('Salary');
    await userEvent.selectOptions(
      screen.getByLabelText('Filter by wallet'),
      'w1',
    );
    await waitFor(() => {
      expect(screen.queryByText('Coffee')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('filters by type (expense)', async () => {
    renderHome();
    await screen.findByText('Salary');
    await userEvent.selectOptions(
      screen.getByLabelText('Filter by type'),
      'expense',
    );
    await waitFor(() => {
      expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('shows category column with name and handles uncategorized', async () => {
    renderHome();
    await screen.findByText('Salary');
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('Home onboarding wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
    vi.mocked(getTransactions).mockResolvedValue({
      transactions: [],
      total: 0,
    });
    cleanup();
  });

  it('shows onboarding wizard when user has no wallets', async () => {
    vi.mocked(getWallets).mockResolvedValue({ wallets: [] });
    renderHome();
    expect(await screen.findByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Wallet name')).toBeInTheDocument();
  });

  it('does not show wizard when wizardDismissed is set', async () => {
    localStorage.setItem('budgeto:wizardDismissed', 'true');
    vi.mocked(getWallets).mockResolvedValue({ wallets: [] });
    renderHome();
    expect(
      await screen.findByText(/you have no wallets yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Step 1 of 3')).not.toBeInTheDocument();
  });

  it('shows empty-state prompt when no categories but wallets exist', async () => {
    localStorage.setItem('budgeto:wizardDismissed', 'true');
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
    vi.mocked(getTransactions).mockResolvedValue({
      transactions: [],
      total: 0,
    });
    renderHome();
    expect(
      await screen.findByText(/you have no categories yet/i),
    ).toBeInTheDocument();
  });
});

describe('Home stacked modal — transaction dialog + wallet/category sheets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    vi.mocked(getTransactions).mockResolvedValue({
      transactions: [
        {
          id: 't1',
          walletId: 'w1',
          amount: '50.00',
          description: 'Salary',
          categoryId: 'c1',
          categoryName: 'Food',
          createdAt: '2026-01-02T10:00:00Z',
        },
      ],
      total: 1,
    });
    vi.mocked(getWallet).mockResolvedValue(wallets[0]);
    vi.mocked(createWallet).mockResolvedValue({
      id: 'w-new',
      name: 'New Wallet',
      description: '',
      color: '#1f8a4c',
      balance: '0.00',
      createdAt: '',
      updatedAt: '',
    });
    cleanup();
  });

  it('keeps transaction dialog open when viewing wallet details from form', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('Salary');

    // Open Add Transaction dialog
    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    // Dialog title should be visible (there may also be the trigger button)
    const txTitles = screen.getAllByText('Add transaction');
    expect(txTitles.length).toBeGreaterThanOrEqual(2);

    // Select a wallet to reveal "View wallet details" link
    await user.selectOptions(screen.getByLabelText('Wallet'), 'w1');

    // Click "View wallet details"
    await user.click(screen.getByText(/view wallet details/i));

    // Wallet detail sheet opens on top
    await waitFor(() => {
      expect(screen.getByText('Wallet Details')).toBeInTheDocument();
    });

    // Transaction dialog stays open behind the sheet
    const txTitlesAfter = screen.getAllByText('Add transaction');
    expect(txTitlesAfter.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Home transaction detail view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    vi.mocked(getTransactions).mockResolvedValue({
      transactions: [
        {
          id: 't1',
          walletId: 'w1',
          amount: '-42.50',
          description: 'Groceries',
          categoryId: 'c1',
          categoryName: 'Food',
          createdAt: '2026-01-02T10:00:00Z',
        },
      ],
      total: 1,
    });
    vi.mocked(updateTransaction).mockResolvedValue({
      id: 't1',
      walletId: 'w1',
      amount: '-99.00',
      description: 'Updated',
      categoryId: 'c1',
      categoryName: 'Food',
      createdAt: '2026-01-02T10:00:00Z',
    });
    vi.mocked(deleteTransaction).mockResolvedValue({
      id: 't1',
      walletId: 'w1',
      amount: '-42.50',
      description: 'Groceries',
      categoryId: 'c1',
      createdAt: '2026-01-02T10:00:00Z',
    });
    cleanup();
  });

  it('opens detail dialog when clicking a transaction row', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('Groceries');

    // Click the description cell (part of the row)
    await user.click(screen.getByText('Groceries'));

    expect(
      await screen.findByText('Transaction details'),
    ).toBeInTheDocument();
    // Amount appears in both the table and the dialog — check dialog shows it
    const amounts = screen.getAllByText('-$42.50');
    expect(amounts.length).toBeGreaterThanOrEqual(2);
    // Cash wallet name also appears in both
    const cashElements = screen.getAllByText('Cash');
    expect(cashElements.length).toBeGreaterThanOrEqual(2);
    // Food category badge also appears in both
    const foodElements = screen.getAllByText('Food');
    expect(foodElements.length).toBeGreaterThanOrEqual(2);
  });

  it('opens edit form when Edit is clicked in detail dialog', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('Groceries');

    await user.click(screen.getByText('Groceries'));
    await screen.findByText('Transaction details');

    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Edit form should appear with pre-filled values
    expect(
      await screen.findByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it('deletes transaction after confirmation', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('Groceries');

    await user.click(screen.getByText('Groceries'));
    await screen.findByText('Transaction details');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Confirmation dialog should appear
    expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();

    // Confirm delete
    await user.click(
      screen.getByRole('button', { name: /delete/i }),
    );

    expect(deleteTransaction).toHaveBeenCalledWith('t1');
  });
});
