import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Categories } from './Categories';

import type * as AuthModule from '../api/auth';
import type * as CategoryModule from '../api/categories';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CategoryModule>();
  return {
    ...actual,
    getCategories: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getCategories } from '../api/categories';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

const mockCategories = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Groceries',
    type: 'expense' as const,
    color: '#ff5733',
    icon: 'ShoppingCart',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c2',
    userId: 'u1',
    name: 'Salary',
    type: 'income' as const,
    color: '#33ff57',
    icon: 'BriefcaseBusiness',
    createdAt: '',
    updatedAt: '',
  },
];

function renderList(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/settings/categories']}>
        <Categories />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Categories page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getCategories).mockResolvedValue({
      categories: mockCategories,
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders the page heading', async () => {
    renderList();
    expect(await screen.findByText('Categories')).toBeInTheDocument();
  });

  it('lists categories with name and type', async () => {
    renderList();
    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('expense')).toBeInTheDocument();
    expect(screen.getByText('income')).toBeInTheDocument();
    expect(document.querySelectorAll('svg')).toHaveLength(2);
  });

  it('shows empty state when no categories exist', async () => {
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
    renderList();
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No categories yet.')).toBeInTheDocument();
  });

  it('opens CategoryModal in create mode when clicking New Category', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Categories');
    await user.click(screen.getByRole('button', { name: /new category/i }));

    await waitFor(() => {
      const titles = screen.getAllByText('New Category');
      expect(titles.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('opens CategoryModal in edit mode when clicking Edit', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Groceries');
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    await waitFor(() => {
      const titles = screen.getAllByText('Edit Category');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });
});
