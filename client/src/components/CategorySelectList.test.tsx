import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelectList } from './CategorySelectList';

import type * as CategoryModule from '../api/categories';

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CategoryModule>();
  return {
    ...actual,
    updateCategory: vi.fn(),
    createCategory: vi.fn(),
  };
});

import { updateCategory, createCategory } from '../api/categories';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

const categories = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Food',
    type: 'expense' as const,
    color: '#ef4444',
    icon: 'UtensilsCrossed',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c2',
    userId: 'u1',
    name: 'Salary',
    type: 'income' as const,
    color: '#22c55e',
    icon: 'BriefcaseBusiness',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'c3',
    userId: 'u1',
    name: 'Car',
    type: 'expense' as const,
    color: '#3b82f6',
    icon: 'Car',
    createdAt: '',
    updatedAt: '',
  },
];

describe('CategorySelectList', () => {
  it('renders all categories as icon chips', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    // Each category should have a chip (role="option")
    const chips = screen.getAllByRole('option');
    expect(chips).toHaveLength(3);
  });

  it('renders category icons with the category color', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    // Food chip should have red color
    const foodChip = screen.getByLabelText('Food');
    expect(foodChip).toHaveStyle({ color: '#ef4444' });
  });

  it('highlights the selected category chip', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId="c2"
        onSelect={vi.fn()}
      />,
    );

    const salaryChip = screen.getByLabelText('Salary');
    expect(salaryChip).toHaveAttribute('data-selected', 'true');
  });

  it('calls onSelect when a chip is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByLabelText('Food'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('shows empty state when no categories provided', () => {
    render(
      <CategorySelectList
        categories={[]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/no categories/i)).toBeInTheDocument();
  });

  it('renders inside a horizontally scrollable container', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    const scrollArea = screen.getByRole('listbox');
    expect(scrollArea).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    // Focus the first chip
    const firstChip = screen.getByLabelText('Food');
    firstChip.focus();
    expect(document.activeElement).toBe(firstChip);

    // ArrowRight moves to second chip
    await user.keyboard('{ArrowRight}');
    const secondChip = screen.getByLabelText('Salary');
    expect(document.activeElement).toBe(secondChip);

    // Enter selects it
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('c2');
  });
});

describe('CategorySelectList — dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateCategory).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      name: 'Food Updated',
      type: 'expense' as const,
      color: '#ef4444',
      icon: 'UtensilsCrossed',
      createdAt: '',
      updatedAt: '',
    });
    vi.mocked(createCategory).mockResolvedValue({
      id: 'c-new',
      userId: 'u1',
      name: 'New Category',
      type: 'expense' as const,
      color: '#1f8a4c',
      icon: 'Tag',
      createdAt: '',
      updatedAt: '',
    });
  });

  it('shows "+" and "View All" buttons', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Add category')).toBeInTheDocument();
    expect(screen.getByLabelText('View all categories')).toBeInTheDocument();
  });

  it('opens edit dialog via Shift+Enter', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    const foodChip = screen.getByLabelText('Food');
    foodChip.focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    await waitFor(() => {
      expect(screen.getByText(/edit category/i)).toBeInTheDocument();
    });
  });

  it('prefills edit dialog with category values', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    const foodChip = screen.getByLabelText('Food');
    foodChip.focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      expect(nameInput.value).toBe('Food');
    });
  });
});
