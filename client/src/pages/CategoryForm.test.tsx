import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { CategoryForm } from './CategoryForm';

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
    createCategory: vi.fn(),
    getCategory: vi.fn(),
    updateCategory: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { createCategory, getCategory, updateCategory } from '../api/categories';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderCreate(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/settings/categories/new']}>
        <Routes>
          <Route path="/settings/categories/new" element={<CategoryForm />} />
          <Route
            path="/settings/categories"
            element={<div>Categories List</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function renderEdit(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/settings/categories/c1/edit']}>
        <Routes>
          <Route
            path="/settings/categories/:id/edit"
            element={<CategoryForm />}
          />
          <Route
            path="/settings/categories"
            element={<div>Categories List</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('CategoryForm — create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(createCategory).mockResolvedValue({
      id: 'new-id',
      userId: 'u1',
      name: '',
      type: 'expense',
      color: '',
      icon: '',
      createdAt: '',
      updatedAt: '',
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders the create heading', async () => {
    renderCreate();
    expect(await screen.findByText('New Category')).toBeInTheDocument();
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    renderCreate();
    await screen.findByText('New Category');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(
      await screen.findByText(/name is required/i),
    ).toBeInTheDocument();
    expect(vi.mocked(createCategory)).not.toHaveBeenCalled();
  });

  it('creates a category and navigates to list', async () => {
    const user = userEvent.setup();
    vi.mocked(createCategory).mockResolvedValue({
      id: 'new-id',
      userId: 'u1',
      name: 'Groceries',
      type: 'expense',
      color: '#ff5733',
      icon: 'ShoppingCart',
      createdAt: '',
      updatedAt: '',
    });
    renderCreate();
    await screen.findByText('New Category');

    await user.type(screen.getByLabelText('Name'), 'Groceries');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(vi.mocked(createCategory)).toHaveBeenCalledWith({
        name: 'Groceries',
        type: 'expense',
        color: '#1f8a4c',
        icon: 'Tag',
      });
    });
    expect(await screen.findByText('Categories List')).toBeInTheDocument();
  });

  it('allows selecting expense or income type', async () => {
    const user = userEvent.setup();
    renderCreate();
    await screen.findByText('New Category');

    const incomeRadio = screen.getByLabelText('Income');
    await user.click(incomeRadio);
    expect(incomeRadio).toBeChecked();

    const expenseRadio = screen.getByLabelText('Expense');
    await user.click(expenseRadio);
    expect(expenseRadio).toBeChecked();
  });
});

describe('CategoryForm — edit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getCategory).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      name: 'Original',
      type: 'expense',
      color: '#ff5733',
      icon: 'ShoppingCart',
      createdAt: '',
      updatedAt: '',
    });
    vi.mocked(updateCategory).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      name: '',
      type: 'expense',
      color: '',
      icon: '',
      createdAt: '',
      updatedAt: '',
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders the edit heading and pre-fills fields', async () => {
    renderEdit();
    expect(await screen.findByText('Edit Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
  });

  it('updates the category and navigates to list', async () => {
    const user = userEvent.setup();
    renderEdit();
    await screen.findByText('Edit Category');

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(vi.mocked(updateCategory)).toHaveBeenCalledWith('c1', {
        name: 'Renamed',
        type: 'expense',
        color: '#ff5733',
        icon: 'ShoppingCart',
      });
    });
    expect(await screen.findByText('Categories List')).toBeInTheDocument();
  });
});
