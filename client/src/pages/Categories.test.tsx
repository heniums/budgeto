import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
    deleteCategory: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getCategories, deleteCategory } from '../api/categories';

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
    icon: 'Briefcase',
    createdAt: '',
    updatedAt: '',
  },
];

function renderList(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account/categories']}>
        <Routes>
          <Route path="/account/categories" element={<Categories />} />
          <Route
            path="/account/categories/new"
            element={<div>Create Category</div>}
          />
          <Route
            path="/account/categories/:id/edit"
            element={<div>Edit Category</div>}
          />
        </Routes>
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
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
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
  });

  it('shows empty state when no categories exist', async () => {
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
    renderList();
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No categories yet.')).toBeInTheDocument();
  });

  it('navigates to create category page', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Categories');
    await user.click(screen.getByRole('link', { name: /new category/i }));
    expect(screen.getByText('Create Category')).toBeInTheDocument();
  });

  it('navigates to edit category page', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Groceries');
    await user.click(screen.getAllByRole('link', { name: /edit/i })[0]);
    expect(screen.getByText('Edit Category')).toBeInTheDocument();
  });

  it('deletes a category after confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);

    renderList();
    await screen.findByText('Groceries');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(vi.mocked(deleteCategory)).toHaveBeenCalledWith('c1');
    });
  });
});
