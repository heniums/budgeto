import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelectList } from './CategorySelectList';

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
    name: 'Food',
    color: '#ef4444',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'c2',
    name: 'Salary',
    color: '#22c55e',
    icon: 'BriefcaseBusiness',
  },
  {
    id: 'c3',
    name: 'Car',
    color: '#3b82f6',
    icon: 'Car',
  },
];

describe('CategorySelectList — rendering', () => {
  it('renders all categories as icon chips', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

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

    const firstChip = screen.getByLabelText('Food');
    firstChip.focus();
    expect(document.activeElement).toBe(firstChip);

    await user.keyboard('{ArrowRight}');
    const secondChip = screen.getByLabelText('Salary');
    expect(document.activeElement).toBe(secondChip);

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('c2');
  });
});

describe('CategorySelectList — callbacks', () => {
  it('calls onCreate when "+" button is clicked', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();

    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
        onCreate={onCreate}
      />,
    );

    await user.click(screen.getByLabelText('Add category'));
    expect(onCreate).toHaveBeenCalled();
  });

  it('calls onViewAll when grid button is clicked', async () => {
    const onViewAll = vi.fn();
    const user = userEvent.setup();

    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
        onViewAll={onViewAll}
      />,
    );

    await user.click(screen.getByLabelText('View all categories'));
    expect(onViewAll).toHaveBeenCalled();
  });

  it('calls onEdit when Shift+Enter is pressed on a chip', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
        onEdit={onEdit}
      />,
    );

    const foodChip = screen.getByLabelText('Food');
    foodChip.focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onEdit).toHaveBeenCalledWith({
      id: 'c1',
      name: 'Food',
      color: '#ef4444',
      icon: 'UtensilsCrossed',
    });
  });

  it('hides "+" button when onCreate is not provided', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText('Add category'),
    ).not.toBeInTheDocument();
  });

  it('hides "View All" button when onViewAll is not provided', () => {
    render(
      <CategorySelectList
        categories={categories}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText('View all categories'),
    ).not.toBeInTheDocument();
  });
});
