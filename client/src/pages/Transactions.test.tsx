import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { Transactions } from './Transactions';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

  class MockIntersectionObserver {
    static instances: MockIntersectionObserver[] = [];
    callback: IntersectionObserverCallback;
    observed: Element | null = null;
    constructor(cb: IntersectionObserverCallback) {
      this.callback = cb;
      MockIntersectionObserver.instances.push(this);
    }
    observe(el: Element): void {
      this.observed = el;
    }
    unobserve(): void {}
    disconnect(): void {}
    trigger(isIntersecting = true): void {
      this.callback(
        [
          {
            isIntersecting,
            target: this.observed,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      );
    }
  }
  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

import type * as TxModule from '../api/transactions';
import type * as WalletModule from '../api/wallets';
import type * as CatModule from '../api/categories';

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TxModule>();
  return {
    ...actual,
    getTransactions: vi.fn(),
    getTransactionsSummary: vi.fn(),
    getTransaction: vi.fn(),
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

import {
  getTransactions,
  getTransactionsSummary,
  getTransaction,
  deleteTransaction,
  type TransactionData,
} from '../api/transactions';
import { formatMoney } from '../lib/currencies';
import { getWallets, getWallet, createWallet } from '../api/wallets';
import { getCategories } from '../api/categories';
import { ApiError } from '../api/client';

let transactionsFixture: TransactionData[] = [];

// Simulate the server-side filtering + pagination the real API performs.
vi.mocked(getTransactions).mockImplementation(async (params) => {
  const p = params ?? {};
  let items = [...transactionsFixture];
  if (p.walletId) items = items.filter((t) => t.walletId === p.walletId);
  if (p.categoryId) items = items.filter((t) => t.categoryId === p.categoryId);
  if (p.type === 'income') items = items.filter((t) => Number(t.amount) > 0);
  if (p.type === 'expense') items = items.filter((t) => Number(t.amount) < 0);
  if (p.search) {
    const needle = p.search.toLowerCase();
    items = items.filter((t) => t.description.toLowerCase().includes(needle));
  }
  if (p.from) {
    const from = new Date(p.from);
    items = items.filter((t) => new Date(t.createdAt) >= from);
  }
  if (p.to) {
    const to = new Date(p.to);
    items = items.filter((t) => new Date(t.createdAt) <= to);
  }
  const offset = p.offset ?? 0;
  const limit = p.limit ?? 50;
  return {
    transactions: items.slice(offset, offset + limit),
    total: items.length,
  };
});

vi.mocked(getTransactionsSummary).mockResolvedValue({ groups: [] });

// Row clicks deep-link via '?tx=<id>'; serve the clicked row from the fixture.
vi.mocked(getTransaction).mockImplementation(async (id) => {
  const tx = transactionsFixture.find((t) => t.id === id);
  if (!tx) {
    throw new ApiError('Transaction not found', 404, 'NOT_FOUND');
  }
  return tx;
});

const mockCategories = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Food',
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
    currency: 'USD',
    balance: '100.00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Savings',
    description: '',
    color: '#2f6fed',
    currency: 'USD',
    balance: '50.00',
    createdAt: '',
    updatedAt: '',
  },
];

function renderHome(initialEntry = '/'): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={createTestQueryClient()}>
        <Transactions />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Home transactions list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      global.IntersectionObserver as unknown as {
        instances: { trigger: (v?: boolean) => void }[];
      }
    ).instances.length = 0;
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 't2',
        walletId: 'w2',
        amount: '-20.00',
        description: 'Coffee',
        categoryId: null,
        categoryName: null,
        createdAt: '2026-01-14T10:00:00Z',
        date: '2026-01-14T10:00:00.000Z',
      },
    ];
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    cleanup();
  });

  it('renders grouped period skeletons while the list loads', () => {
    vi.mocked(getTransactions).mockImplementationOnce(
      () => new Promise(() => {}),
    );
    renderHome();
    expect(screen.getAllByTestId('period-header-skeleton')).toHaveLength(2);
    for (const header of [
      'Date',
      'Wallet',
      'Category',
      'Description',
      'Amount',
    ]) {
      expect(screen.getAllByText(header).length).toBeGreaterThan(0);
    }
  });

  it('lists all user transactions newest first', async () => {
    renderHome();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('renders time-only date cells on the day preset', async () => {
    renderHome();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
    // Day groups carry the date in the sticky period header; rows show time.
    expect(screen.getAllByText(/^\d{1,2}:\d{2} (AM|PM)$/).length).toBe(2);
    // No year anywhere in the table.
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it('shows day-of-month with time on the month preset', async () => {
    renderHome();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Date range'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Month' }));
    // Switching presets changes the query key; wait for the refetched rows.
    expect(await screen.findByText(/Jan 15,/)).toBeInTheDocument();
    const cells = screen.getAllByText(
      /^[A-Z][a-z]{2} \d{1,2}, \d{1,2}:\d{2} (AM|PM)$/,
    );
    expect(cells).toHaveLength(2);
    expect(cells.map((c) => c.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Jan 15/),
        expect.stringMatching(/Jan 14/),
      ]),
    );
  });

  it('renders the wallet as a colored pill on mobile', async () => {
    renderHome();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
    const pill = screen.getByText('Cash');
    expect(pill).toHaveClass('rounded-full');
    // Wallet column is not hidden behind md:table-cell anymore.
    expect(pill.closest('td')).not.toHaveClass('hidden');
    expect(pill.style.backgroundColor).toMatch(/1f8a4c|31, 138, 76/i);
    expect(pill.style.color).toMatch(/1f8a4c|31, 138, 76/i);
  });

  it('filters by wallet on the server', async () => {
    renderHome();
    await screen.findByText('Salary');
    await userEvent.click(screen.getByLabelText('Filter by wallet'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cash' }));
    await waitFor(() => {
      expect(screen.queryByText('Coffee')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('filters by type (expense) on the server', async () => {
    renderHome();
    await screen.findByText('Salary');
    await userEvent.click(screen.getByLabelText('Filter by type'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Expense' }));
    await waitFor(() => {
      expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('filters by category on the server', async () => {
    renderHome();
    await screen.findByText('Salary');
    await userEvent.click(screen.getByLabelText('Filter by category'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Food' }));
    await waitFor(() => {
      expect(screen.queryByText('Coffee')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows category column with name and handles uncategorized', async () => {
    renderHome();
    await screen.findByText('Salary');
    const salaryRow = screen.getByText('Salary').closest('tr');
    const coffeeRow = screen.getByText('Coffee').closest('tr');
    expect(
      within(salaryRow as HTMLElement).getByText('Food'),
    ).toBeInTheDocument();
    expect(within(coffeeRow as HTMLElement).getByText('—')).toBeInTheDocument();
  });

  it('opens transaction dialog when clicking the FAB', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('Transactions');

    // Two "Add transaction" buttons exist (header + FAB); [1] is the FAB.
    // Wait for the wallets/categories query data that gates both buttons.
    let buttons: HTMLElement[] = [];
    await waitFor(() => {
      buttons = screen.getAllByRole('button', { name: /add transaction/i });
      expect(buttons).toHaveLength(2);
    });
    await user.click(buttons[1]); // [1] is the FAB

    // The transaction dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('hides the FAB when wallets or categories is empty', async () => {
    // Empty wallets: dismiss the wizard so the page renders its empty state
    localStorage.setItem('budgeto:wizardDismissed', 'true');
    vi.mocked(getWallets).mockResolvedValue({ wallets: [] });
    renderHome();
    await screen.findByText('Transactions');

    // Only the disabled header button remains — the FAB should not be present
    const addButtons = screen.queryAllByRole('button', {
      name: /add transaction/i,
    });
    expect(addButtons).toHaveLength(1);
    cleanup();

    // Empty categories with wallets present
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
    renderHome();
    await screen.findByText('Transactions');

    // Only the disabled header button remains — the FAB should not be present
    expect(
      screen.queryAllByRole('button', { name: /add transaction/i }),
    ).toHaveLength(1);
  });
});

describe('Home onboarding wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    transactionsFixture = [];
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
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
    renderHome();
    expect(
      await screen.findByText(/you have no categories yet/i),
    ).toBeInTheDocument();
  });
});

describe('Home period grouping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    cleanup();
  });

  it('groups same-day transactions under one day header', async () => {
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '5.00',
        description: 'Morning',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T12:00:00Z',
        date: '2026-01-15T12:00:00.000Z',
      },
      {
        id: 't2',
        walletId: 'w1',
        amount: '5.00',
        description: 'Evening',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T13:00:00Z',
        date: '2026-01-15T13:00:00.000Z',
      },
    ];
    renderHome();
    await screen.findByText('Morning');
    expect(screen.getByText('Evening')).toBeInTheDocument();
    expect(screen.getAllByTestId('period-header')).toHaveLength(1);
  });

  it('splits transactions on different days into separate headers', async () => {
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '5.00',
        description: 'Recent',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T08:00:00Z',
        date: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 't2',
        walletId: 'w1',
        amount: '5.00',
        description: 'Older',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-10T08:00:00Z',
        date: '2026-01-10T08:00:00.000Z',
      },
    ];
    renderHome();
    await screen.findByText('Recent');
    expect(screen.getAllByTestId('period-header')).toHaveLength(2);
  });

  it('changes grouping granularity when the preset changes', async () => {
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '5.00',
        description: 'Jan mid',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T08:00:00Z',
        date: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 't2',
        walletId: 'w1',
        amount: '5.00',
        description: 'Jan early',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-04T08:00:00Z',
        date: '2026-01-04T08:00:00.000Z',
      },
    ];
    renderHome();
    await screen.findByText('Jan mid');
    // Day preset: two different days => two headers.
    expect(screen.getAllByTestId('period-header')).toHaveLength(2);

    await userEvent.click(screen.getByLabelText('Date range'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Month' }));
    // Month preset: both in January => single header.
    await waitFor(() => {
      expect(screen.getAllByTestId('period-header')).toHaveLength(1);
    });
  });

  it('reveals custom date inputs when Custom is selected', async () => {
    transactionsFixture = [];
    renderHome();
    await screen.findByText(/no transactions found/i);
    expect(screen.queryByLabelText('From date')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Date range'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Custom' }));
    expect(await screen.findByLabelText('From date')).toBeInTheDocument();
    expect(screen.getByLabelText('To date')).toBeInTheDocument();
  });
});

describe('Home infinite scroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      global.IntersectionObserver as unknown as {
        instances: { trigger: (v?: boolean) => void }[];
      }
    ).instances.length = 0;
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    // 25 transactions, newest first, all in wallet w1 / category c1.
    transactionsFixture = Array.from({ length: 25 }, (_, i) => ({
      id: `t${i}`,
      walletId: 'w1',
      amount: `${i}.00`,
      description: `Item ${i}`,
      categoryId: 'c1',
      categoryName: 'Food',
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      date: new Date(Date.now() - i * 1000).toISOString(),
    }));
    cleanup();
  });

  it('loads the next page when the sentinel scrolls into view', async () => {
    renderHome();
    await screen.findByText('Item 0');
    // PAGE_SIZE is 20, so the 21st item is not present yet.
    expect(screen.queryByText('Item 24')).not.toBeInTheDocument();
    expect(screen.getByText('20 of 25 transactions')).toBeInTheDocument();

    await waitFor(() => {
      const observer = (
        global.IntersectionObserver as unknown as {
          instances: { trigger: (v?: boolean) => void }[];
        }
      ).instances.at(-1);
      expect(observer).toBeDefined();
      observer?.trigger();
      expect(screen.queryByText('Item 24')).toBeInTheDocument();
    });

    expect(screen.getByText('25 of 25 transactions')).toBeInTheDocument();
  });
});

describe('Home sequential modal — transaction + wallet/category', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-02T10:00:00Z',
        date: '2026-01-02T10:00:00.000Z',
      },
    ];
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    vi.mocked(getWallet).mockResolvedValue(wallets[0]);
    vi.mocked(createWallet).mockResolvedValue({
      id: 'w-new',
      name: 'New Wallet',
      description: '',
      color: '#1f8a4c',
      currency: 'USD',
      balance: '0.00',
      createdAt: '',
      updatedAt: '',
    });
    cleanup();
  });

  it('opens WalletModal when "Don\'t see your wallet?" is clicked in tx form', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText('Salary');

    // data-testid is more stable than getAllByRole(...)[0] which depends on DOM order
    await user.click(screen.getByTestId('header-add-button'));

    // Click the wallet creation link text
    await user.click(screen.getByText(/don't see your wallet\?/i));

    // WalletModal should open in create mode
    await waitFor(() => {
      expect(screen.getByText('New Wallet')).toBeInTheDocument();
    });
  });
});

describe('Home responsive layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
    ];
    cleanup();
  });

  it('wraps each transaction table in an overflow-hidden container for mobile', async () => {
    renderHome();
    await screen.findByText('Salary');
    const table = screen.getByText('Salary').closest('table');
    expect(table?.parentElement).toHaveClass('memphis-card');
    expect(table?.parentElement).toHaveClass('overflow-hidden');
  });
});

describe('Home delete refetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 't2',
        walletId: 'w2',
        amount: '-20.00',
        description: 'Coffee',
        categoryId: null,
        categoryName: null,
        createdAt: '2026-01-14T10:00:00Z',
        date: '2026-01-14T10:00:00.000Z',
      },
    ];
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    cleanup();
  });

  it('refetches the list from the server after deleting', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTransaction).mockResolvedValue({
      id: 't1',
      walletId: 'w1',
      amount: '50.00',
      description: 'Salary',
      categoryId: 'c1',
      categoryName: 'Food',
      date: '2026-01-15T10:00:00.000Z',
      createdAt: '2026-01-15T10:00:00Z',
    });
    renderHome();
    await screen.findByText('Salary');
    const listCallsBefore = vi.mocked(getTransactions).mock.calls.length;

    // Open the edit dialog for t1, then its delete confirmation.
    await user.click(screen.getByText('Salary'));
    await user.click(await screen.findByText('Delete this transaction'));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteTransaction).toHaveBeenCalledWith('t1');
    });
    // Invalidation (not local splice) must drive the update: the list query
    // refetches from the mocked API after the delete succeeds.
    await waitFor(() => {
      expect(vi.mocked(getTransactions).mock.calls.length).toBeGreaterThan(
        listCallsBefore,
      );
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an error alert and keeps the dialog open when delete fails', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTransaction).mockRejectedValue(new Error('network down'));
    renderHome();
    await screen.findByText('Salary');

    await user.click(screen.getByText('Salary'));
    await user.click(await screen.findByText('Delete this transaction'));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to delete transaction.',
    );
    expect(screen.getByText('Delete transaction')).toBeInTheDocument();

    // A subsequent successful delete still closes the dialog.
    vi.mocked(deleteTransaction).mockResolvedValue({
      id: 't1',
      walletId: 'w1',
      amount: '50.00',
      description: 'Salary',
      categoryId: 'c1',
      categoryName: 'Food',
      date: '2026-01-15T10:00:00.000Z',
      createdAt: '2026-01-15T10:00:00Z',
    });
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(deleteTransaction).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('keeps the delete dialog open when dismissal is attempted mid-flight and surfaces the failure', async () => {
    const user = userEvent.setup();
    // Keep the delete in flight so dismissal is attempted while deleting.
    // Executor form: tsconfig lib is ES2022, which predates
    // Promise.withResolvers.
    let rejectDelete: (err: unknown) => void = () => {};
    vi.mocked(deleteTransaction).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    renderHome();
    await screen.findByText('Salary');

    await user.click(screen.getByText('Salary'));
    await user.click(await screen.findByText('Delete this transaction'));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    // Cancel is disabled and the dialog stays open while the request is in
    // flight — closing it would unmount the FormAlert and swallow the error.
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // The failure surfaces in the still-open dialog instead of vanishing.
    await act(async () => {
      rejectDelete(new Error('network down'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to delete transaction.',
    );
  });

  it('completes a cascade delete after a partial failure retry', async () => {
    const user = userEvent.setup();
    // Transfer pair: same description, opposite signs, created within 2s.
    transactionsFixture = [
      {
        id: 'p1',
        walletId: 'w1',
        amount: '-100.00',
        description: 'Transfer to Savings',
        categoryId: null,
        categoryName: null,
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 'p2',
        walletId: 'w2',
        amount: '100.00',
        description: 'Transfer to Savings',
        categoryId: null,
        categoryName: null,
        createdAt: '2026-01-15T10:00:01Z',
        date: '2026-01-15T10:00:01.000Z',
      },
    ];
    const legResult = (id: string): TransactionData => ({
      id,
      walletId: id === 'p1' ? 'w1' : 'w2',
      amount: id === 'p1' ? '-100.00' : '100.00',
      description: 'Transfer to Savings',
      categoryId: null,
      categoryName: null,
      date:
        id === 'p1' ? '2026-01-15T10:00:00.000Z' : '2026-01-15T10:00:01.000Z',
      createdAt: id === 'p1' ? '2026-01-15T10:00:00Z' : '2026-01-15T10:00:01Z',
    });
    vi.mocked(deleteTransaction)
      .mockResolvedValueOnce(legResult('p2')) // first leg deletes...
      .mockRejectedValueOnce(new Error('network down')) // ...second leg fails
      // Retry: the first leg is already gone server-side (404)...
      .mockRejectedValueOnce(
        new ApiError('Transaction not found', 404, 'NOT_FOUND'),
      )
      // ...but the second leg now deletes and the dialog must close.
      .mockResolvedValueOnce(legResult('p1'));

    renderHome();
    await screen.findAllByText('Transfer to Savings');
    const listCallsBefore = vi.mocked(getTransactions).mock.calls.length;

    // Both rows share a description; the newest (p2) renders first.
    await user.click(screen.getAllByText('Transfer to Savings')[0]);
    await user.click(await screen.findByText('Delete this transaction'));
    await user.click(await screen.findByText('Yes, delete both'));

    // Partial failure keeps the dialog open with the error, and the list
    // still refreshes so the leg that did get deleted disappears.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to delete transaction.',
    );
    expect(screen.getByText('Delete transfer leg')).toBeInTheDocument();
    await waitFor(() => {
      expect(vi.mocked(getTransactions).mock.calls.length).toBeGreaterThan(
        listCallsBefore,
      );
    });

    // The retry must survive the 404 on the already-deleted leg.
    await user.click(await screen.findByText('Yes, delete both'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const ids = vi.mocked(deleteTransaction).mock.calls.map((call) => call[0]);
    expect(ids).toHaveLength(4);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[2]).toBe(ids[0]);
    expect(ids[3]).toBe(ids[1]);
  });
});

describe('Home transaction summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      global.IntersectionObserver as unknown as {
        instances: { trigger: (v?: boolean) => void }[];
      }
    ).instances.length = 0;
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
    ];
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    vi.mocked(getTransactionsSummary).mockResolvedValue({
      groups: [
        { key: '2026-01-15', net: [{ currency: 'USD', amount: '50.00' }] },
      ],
    });
    cleanup();
  });

  it('renders per-group net amounts next to period headers', async () => {
    renderHome();
    const periodHeaders = await screen.findAllByTestId('period-header');
    expect(periodHeaders).toHaveLength(1);
    // The net amount should appear near the period header
    expect(periodHeaders[0].parentElement).toHaveTextContent('50.00');
    expect(periodHeaders[0].parentElement).toHaveTextContent('USD');
  });

  it('renders different net values for different day groups', async () => {
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 't2',
        walletId: 'w1',
        amount: '-20.00',
        description: 'Lunch',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-14T12:00:00Z',
        date: '2026-01-14T12:00:00.000Z',
      },
    ];
    vi.mocked(getTransactionsSummary).mockResolvedValue({
      groups: [
        { key: '2026-01-15', net: [{ currency: 'USD', amount: '50.00' }] },
        { key: '2026-01-14', net: [{ currency: 'USD', amount: '-20.00' }] },
      ],
    });
    renderHome();
    const periodHeaders = await screen.findAllByTestId('period-header');
    expect(periodHeaders).toHaveLength(2);
    // Groups render newest first, so header[0] is 2026-01-15 and header[1] is
    // 2026-01-14. Each period header row should contain its corresponding net
    // amount as formatted by the app (locale-dependent symbol placement).
    const headerTexts = periodHeaders.map(
      (el) => el.parentElement?.textContent ?? '',
    );
    expect(headerTexts[0]).toContain(formatMoney('50.00', 'USD'));
    expect(headerTexts[1]).toContain(formatMoney('-20.00', 'USD'));
  });

  it('re-fetches the summary when the date preset changes', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findAllByTestId('period-header');

    // Open the date range menu and click the "Month" preset.
    const dateButton = screen.getByLabelText('Date range');
    await user.click(dateButton);
    const monthOption = await screen.findByRole('menuitem', { name: /month/i });
    await user.click(monthOption);

    await waitFor(() => {
      expect(getTransactionsSummary).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Transaction deep links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionsFixture = [
      {
        id: 't1',
        walletId: 'w1',
        amount: '50.00',
        description: 'Salary',
        categoryId: 'c1',
        categoryName: 'Food',
        createdAt: '2026-01-15T10:00:00Z',
        date: '2026-01-15T10:00:00.000Z',
      },
    ];
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories: mockCategories });
    cleanup();
  });

  it('opens the edit dialog for a deep-linked transaction', async () => {
    renderHome('/transactions?tx=t1');

    await waitFor(() => {
      expect(vi.mocked(getTransaction)).toHaveBeenCalledWith('t1');
    });
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Edit transaction' }),
    ).toBeInTheDocument();
    // The form loads the deep-linked transaction's data.
    expect(
      await within(dialog).findByDisplayValue('Salary'),
    ).toBeInTheDocument();
  });

  it('opens the add dialog for ?tx=new', async () => {
    renderHome('/transactions?tx=new');

    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByRole('heading', {
        name: 'Add transaction',
      }),
    ).toBeInTheDocument();
    expect(vi.mocked(getTransaction)).not.toHaveBeenCalled();
  });

  it('closes the dialog when a deep-linked transaction does not exist', async () => {
    renderHome('/transactions?tx=missing');

    // The stale link must not wedge the edit dialog open.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
