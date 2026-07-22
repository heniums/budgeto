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
    color: '#ff5733',
    icon: 'ShoppingCart',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '',
  },
  {
    id: 'c2',
    userId: 'u1',
    name: 'Salary',
    color: '#33ff57',
    icon: 'BriefcaseBusiness',
    createdAt: '2025-03-01T10:00:00Z',
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
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
    window.localStorage.clear();
    cleanup();
  });

  it('renders the page heading', async () => {
    renderList();
    expect(await screen.findByText('Categories')).toBeInTheDocument();
  });

  it('lists categories in a table with name, color, and date', async () => {
    renderList();
    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    // Color hex values
    expect(screen.getByText('#ff5733')).toBeInTheDocument();
    // Icons (2 categories, each has an SVG icon)
    expect(document.querySelectorAll('svg')).toHaveLength(2);
    // Action buttons
    expect(
      screen.getByRole('button', { name: 'Edit Groceries' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Groceries' }),
    ).toBeInTheDocument();
  });

  it('shows empty state when no categories exist', async () => {
    vi.mocked(getCategories).mockResolvedValue({ categories: [] });
    renderList();
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No categories yet.')).toBeInTheDocument();
  });

  it('filters categories by name via search input', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Groceries');

    const searchInput = screen.getByLabelText('Search categories');
    await user.type(searchInput, 'sal');

    await waitFor(() => {
      expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows no-match message when search yields nothing', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Groceries');

    const searchInput = screen.getByLabelText('Search categories');
    await user.type(searchInput, 'zzznotfound');

    expect(
      await screen.findByText('No categories match your search.'),
    ).toBeInTheDocument();
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

  it('opens CategoryModal in edit mode when clicking Edit button', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Groceries');
    await user.click(screen.getByRole('button', { name: 'Edit Groceries' }));

    await waitFor(() => {
      const titles = screen.getAllByText('Edit Category');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens CategoryModal in view mode when clicking a category name', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Groceries');
    await user.click(screen.getByText('Groceries'));

    await waitFor(() => {
      const titles = screen.getAllByText('Edit Category');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deletes a category after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderList();
    await screen.findByText('Groceries');

    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteCategory).toHaveBeenCalledWith('c1');
    await waitFor(() => {
      expect(getCategories).toHaveBeenCalledTimes(2); // initial + reload
    });
    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderList();
    await screen.findByText('Groceries');

    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteCategory).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
