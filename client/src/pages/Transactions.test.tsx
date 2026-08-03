import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import { getTransactions, getTransactionsSummary, type TransactionData } from '../api/transactions';
import { formatMoney } from '../lib/currencies';
import { getWallets, getWallet, createWallet } from '../api/wallets';
import { getCategories } from '../api/categories';

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

function renderHome(): void {
  render(
    <MemoryRouter>
      <Transactions />
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

  it('lists all user transactions newest first', async () => {
    renderHome();
    expect(await screen.findByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('filters by wallet on the server', async () => {
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

  it('filters by type (expense) on the server', async () => {
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

  it('filters by category on the server', async () => {
    renderHome();
    await screen.findByText('Salary');
    await userEvent.selectOptions(
      screen.getByLabelText('Filter by category'),
      'c1',
    );
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
    const buttons = screen.getAllByRole('button', { name: /add transaction/i });
    expect(buttons).toHaveLength(2);
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

    await userEvent.click(screen.getByRole('button', { name: /date:/i }));
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

    await userEvent.click(screen.getByRole('button', { name: /date:/i }));
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
    expect(table?.parentElement?.parentElement).toHaveClass('rounded-md');
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
      groups: [{ key: '2026-01-15', net: [{ currency: 'USD', amount: '50.00' }] }],
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
    const dateButton = screen.getByRole('button', { name: /date:/i });
    await user.click(dateButton);
    const monthOption = await screen.findByRole('menuitem', { name: /month/i });
    await user.click(monthOption);

    await waitFor(() => {
      expect(getTransactionsSummary).toHaveBeenCalledTimes(2);
    });
  });
});
