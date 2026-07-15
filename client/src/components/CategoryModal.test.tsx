import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryModal } from './CategoryModal';

import type * as CategoryModule from '../api/categories';

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CategoryModule>();
  return {
    ...actual,
    getCategory: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  };
});

import { createCategory, getCategory, updateCategory } from '../api/categories';

const mockCategory = {
  id: 'c1',
  userId: 'u1',
  name: 'Groceries',
  type: 'expense' as const,
  color: '#ff6b6b',
  icon: 'ShoppingCart',
  createdAt: '',
  updatedAt: '',
};

describe('CategoryModal — create mode (no categoryId)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders create form with name, type, color, and icon grid', () => {
    render(
      <CategoryModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />,
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tag')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('calls createCategory and onSuccess on submit', async () => {
    vi.mocked(createCategory).mockResolvedValue(mockCategory);
    const onSuccess = vi.fn();

    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Food');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: 'Food',
        type: 'expense',
        color: '#1f8a4c',
        icon: 'Tag',
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe('CategoryModal — edit mode (categoryId provided)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCategory).mockResolvedValue(mockCategory);
    cleanup();
  });

  it('renders loading state while fetching', () => {
    vi.mocked(getCategory).mockImplementation(() => new Promise(() => {}));

    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('fetches category and prefills form fields', async () => {
    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getCategory).toHaveBeenCalledWith('c1');
    });
    expect(await screen.findByDisplayValue('Groceries')).toBeInTheDocument();
  });

  it('renders Save Changes disabled when form is not dirty', async () => {
    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={vi.fn()}
      />,
    );

    await screen.findByDisplayValue('Groceries');

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('enables Save Changes when form becomes dirty', async () => {
    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={vi.fn()}
      />,
    );

    await screen.findByDisplayValue('Groceries');

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Food');

    expect(
      screen.getByRole('button', { name: 'Save Changes' }),
    ).not.toBeDisabled();
  });

  it('calls updateCategory and onSuccess on save', async () => {
    vi.mocked(updateCategory).mockResolvedValue(mockCategory);
    const onSuccess = vi.fn();

    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={onSuccess}
      />,
    );

    await screen.findByDisplayValue('Groceries');

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Food');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateCategory).toHaveBeenCalledWith('c1', {
        name: 'Food',
        type: 'expense',
        color: '#ff6b6b',
        icon: 'ShoppingCart',
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('renders Delete button when categoryId is provided', async () => {
    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete' }),
      ).toBeInTheDocument();
    });
  });

  it('shows error when category fetch fails', async () => {
    vi.mocked(getCategory).mockRejectedValue(new Error('Not found'));

    render(
      <CategoryModal
        open={true}
        onOpenChange={vi.fn()}
        categoryId="c1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load category.')).toBeInTheDocument();
    });
  });
});
