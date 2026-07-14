import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDetailSheet } from './CategoryDetailSheet';

import type * as CatModule from '../api/categories';

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CatModule>();
  return {
    ...actual,
    getCategory: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
  };
});

import { getCategory, createCategory } from '../api/categories';

const mockCategory = {
  id: 'c1',
  userId: 'u1',
  name: 'Food',
  type: 'expense' as const,
  color: '#ff6b6b',
  icon: 'UtensilsCrossed',
  createdAt: '',
  updatedAt: '',
};

describe('CategoryDetailSheet — create mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders create form when categoryId is not provided', async () => {
    const onSuccess = vi.fn();
    render(
      <CategoryDetailSheet
        categoryId=""
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Create' });
    expect(submitBtn).toBeInTheDocument();
  });

  it('calls createCategory API and onSuccess on submit', async () => {
    vi.mocked(createCategory).mockResolvedValue({
      id: 'c-new',
      userId: 'u1',
      name: 'Groceries',
      type: 'expense',
      color: '#ff6b6b',
      icon: 'Tag',
      createdAt: '',
      updatedAt: '',
    });
    const onSuccess = vi.fn();

    render(
      <CategoryDetailSheet
        categoryId=""
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Groceries');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: 'Groceries',
        type: 'expense',
        color: '#ff6b6b',
        icon: 'Tag',
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('does not fetch category data in create mode', () => {
    render(
      <CategoryDetailSheet
        categoryId=""
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(getCategory).not.toHaveBeenCalled();
  });
});

describe('CategoryDetailSheet — edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCategory).mockResolvedValue(mockCategory);
    cleanup();
  });

  it('fetches and displays category data when categoryId is provided', async () => {
    render(
      <CategoryDetailSheet
        categoryId="c1"
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getCategory).toHaveBeenCalledWith('c1');
    });
    expect(await screen.findByDisplayValue('Food')).toBeInTheDocument();
  });

  it('renders Save button in edit mode', async () => {
    render(
      <CategoryDetailSheet
        categoryId="c1"
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });
});
