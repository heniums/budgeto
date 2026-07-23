import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Budgets } from './Budgets';

import type * as AuthModule from '../api/auth';
import type * as BudgetModule from '../api/budgets';
import type * as CategoryModule from '../api/categories';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});

vi.mock('../api/budgets', async (importOriginal) => {
  const actual = await importOriginal<typeof BudgetModule>();
  return {
    ...actual,
    getBudgets: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
  };
});

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CategoryModule>();
  return {
    ...actual,
    getCategories: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getBudgets, deleteBudget } from '../api/budgets';
import { getCategories } from '../api/categories';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

const mockCategories = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Groceries',
    color: '#ff5733',
    icon: 'ShoppingCart',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '',
  },
];

const mockBudgets = [
  {
    id: 'b1',
    userId: 'u1',
    name: 'Monthly Spending',
    icon: 'Wallet',
    color: '#1f8a4c',
    type: 'spending' as const,
    period: {
      type: 'monthly' as const,
      window: {
        type: 'monthly' as const,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      },
    },
    totalAmount: '500.00',
    spent: '50.00',
    remaining: '450.00',
    categories: [
      {
        categoryId: 'c1',
        category: {
          id: 'c1',
          userId: 'u1',
          name: 'Groceries',
          color: '#ff5733',
          icon: 'ShoppingCart',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '',
        },
        limitAmount: '200.00',
        spent: '50.00',
        remaining: '150.00',
      },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

function renderPage(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/budgets']}>
        <Budgets />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Budgets page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getCategories).mockResolvedValue({
      categories: mockCategories,
    });
    vi.mocked(getBudgets).mockResolvedValue({ budgets: mockBudgets });
    vi.mocked(deleteBudget).mockResolvedValue(undefined);
    window.localStorage.clear();
    cleanup();
  });

  it('renders the page heading and budget list', async () => {
    renderPage();
    expect(await screen.findByText('Budgets')).toBeInTheDocument();
    expect(await screen.findByText('Monthly Spending')).toBeInTheDocument();
    expect(screen.getByText('Add budget')).toBeInTheDocument();
  });

  it('shows budget amounts and category progress', async () => {
    renderPage();
    await screen.findByText('Monthly Spending');
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getAllByText('$50.00')).toHaveLength(2);
    expect(screen.getByText('$450.00')).toBeInTheDocument();
    expect(screen.getByText(/\b10%/)).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText(/\b25%/)).toBeInTheDocument();
  });

  it('shows empty state when no budgets exist', async () => {
    vi.mocked(getBudgets).mockResolvedValue({ budgets: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('Loading budgets…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No budgets yet.')).toBeInTheDocument();
  });

  it('renders period navigation with current period label', async () => {
    renderPage();
    await screen.findByText('Monthly Spending');

    const prevButton = screen.getByTestId('period-nav-prev');
    const nextButton = screen.getByTestId('period-nav-next');
    const label = screen.getByTestId('period-nav-label');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label.textContent).toMatch(/[A-Z][a-z]+ \d{4}/);
  });

  it('calls getBudgets with new period when clicking next month', async () => {
    renderPage();
    await screen.findByText('Monthly Spending');

    // First call was with default period (current month)
    expect(getBudgets).toHaveBeenCalledTimes(1);

    vi.mocked(getBudgets).mockClear();
    vi.mocked(getBudgets).mockResolvedValue({ budgets: mockBudgets });

    const nextButton = screen.getByTestId('period-nav-next');
    nextButton.click();

    await waitFor(() => {
      expect(getBudgets).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}$/));
    });
  });
});
