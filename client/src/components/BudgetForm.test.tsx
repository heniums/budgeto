import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import { BudgetForm } from './BudgetForm';

import type * as BudgetsModule from '../api/budgets';
import type { CategoryData } from '../api/categories';
import type { BudgetData } from '../api/budgets';
import { ApiError } from '../api/client';

vi.mock('../api/budgets', async (importOriginal) => {
  const actual = await importOriginal<typeof BudgetsModule>();
  return {
    __esModule: true,
    ...actual,
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
  };
});

import { createBudget, updateBudget } from '../api/budgets';

const mockedCreateBudget = vi.mocked(createBudget);
const mockedUpdateBudget = vi.mocked(updateBudget);

const testCategories: CategoryData[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    userId: 'u1',
    name: 'Food',
    color: '#ff0000',
    icon: 'UtensilsCrossed',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    userId: 'u1',
    name: 'Transport',
    color: '#00ff00',
    icon: 'Car',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockBudget: BudgetData = {
  id: 'budget-1',
  userId: 'u1',
  name: 'Monthly Groceries',
  icon: 'ShoppingCart',
  color: '#1f8a4c',
  type: 'spending',
  period: {
    type: 'monthly',
    window: { type: 'monthly', startDate: '2024-01-01', endDate: '2024-01-31' },
  },
  totalAmount: '500',
  spent: '100',
  remaining: '400',
  categories: [
    {
      categoryId: testCategories[0].id,
      category: testCategories[0],
      limitAmount: '500',
      spent: '100',
      remaining: '400',
    },
  ],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

function renderForm(props?: {
  editingBudget?: BudgetData | null;
  categories?: CategoryData[];
  onSuccess?: () => void;
  onCancel?: () => void;
}): void {
  const onSuccess = props?.onSuccess ?? vi.fn();
  const onCancel = props?.onCancel ?? vi.fn();

  render(
    <MemoryRouter>
      <Dialog defaultOpen>
        <BudgetForm
          editingBudget={props?.editingBudget ?? null}
          categories={props?.categories ?? testCategories}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Dialog>
    </MemoryRouter>,
  );
}

describe('BudgetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error when name is empty and submit is attempted', async () => {
    renderForm();
    const user = userEvent.setup();

    // Click submit without filling name
    const submitButton = screen.getByRole('button', { name: /add budget/i });
    await user.click(submitButton);

    // Name validation error should appear
    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
    });

    // createBudget should NOT have been called
    expect(mockedCreateBudget).not.toHaveBeenCalled();
  });

  it('allows selecting a category and setting a limit', async () => {
    renderForm();
    const user = userEvent.setup();

    // Click "Add category" button
    const addCategoryButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addCategoryButton);

    // A category select should appear
    const categorySelect = screen.getByLabelText('Category 1') as HTMLSelectElement;
    expect(categorySelect).toBeInTheDocument();

    // Select "Food" category
    await user.selectOptions(categorySelect, testCategories[0].id);
    expect(categorySelect.value).toBe(testCategories[0].id);

    // Set limit amount
    const limitInput = screen.getByLabelText('Limit 1') as HTMLInputElement;
    await user.click(limitInput);
    await user.clear(limitInput);
    await user.type(limitInput, '250');
    expect(limitInput.value).toBe('250');
  });

  it('calls createBudget with correct payload on successful submit', async () => {
    mockedCreateBudget.mockResolvedValueOnce({
      id: 'new-budget',
      userId: 'u1',
      name: 'My Budget',
      icon: 'wallet',
      color: '#1f8a4c',
      type: 'spending',
      period: {
        type: 'monthly',
        window: { type: 'monthly', startDate: '', endDate: '' },
      },
      totalAmount: '500',
      spent: '0',
      remaining: '500',
      categories: [],
      createdAt: '',
      updatedAt: '',
    });

    const onSuccess = vi.fn();
    renderForm({ onSuccess });
    const user = userEvent.setup();

    // Fill name
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'My Budget');

    // Fill total amount
    const totalInput = screen.getByLabelText('Total amount') as HTMLInputElement;
    await user.click(totalInput);
    await user.clear(totalInput);
    await user.type(totalInput, '500');

    // Add a category
    await user.click(screen.getByRole('button', { name: /add category/i }));
    const categorySelect = screen.getByLabelText('Category 1') as HTMLSelectElement;
    await user.selectOptions(categorySelect, testCategories[0].id);

    const limitInput = screen.getByLabelText('Limit 1') as HTMLInputElement;
    await user.click(limitInput);
    await user.clear(limitInput);
    await user.type(limitInput, '500');

    // Submit
    await user.click(screen.getByRole('button', { name: /add budget/i }));

    await waitFor(() => {
      expect(mockedCreateBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Budget',
          totalAmount: '500',
          categories: [
            expect.objectContaining({
              categoryId: testCategories[0].id,
              limitAmount: '500',
            }),
          ],
        }),
      );
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('pre-fills fields in edit mode and calls updateBudget on submit', async () => {
    mockedUpdateBudget.mockResolvedValueOnce({
      ...mockBudget,
      name: 'Updated Groceries',
    });

    const onSuccess = vi.fn();
    renderForm({ editingBudget: mockBudget, onSuccess });
    const user = userEvent.setup();

    // Verify pre-filled values
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Monthly Groceries');

    // Total amount shows formatted when not focused; focus to see raw
    const totalInput = screen.getByLabelText('Total amount') as HTMLInputElement;
    await user.click(totalInput);
    expect(totalInput.value).toBe('500');

    // Dialog title should say "Edit budget"
    expect(screen.getByText('Edit budget')).toBeInTheDocument();

    // Modify name to trigger isDirty
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Groceries');

    // Submit
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedUpdateBudget).toHaveBeenCalledWith(
        'budget-1',
        expect.objectContaining({
          name: 'Updated Groceries',
        }),
      );
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('displays API error via FormAlert when createBudget rejects', async () => {
    mockedCreateBudget.mockRejectedValueOnce(
      new ApiError('Failed to create budget', 500, 'BUDGET_ERROR'),
    );

    renderForm();
    const user = userEvent.setup();

    // Fill required fields
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Test Budget');

    const totalInput = screen.getByLabelText('Total amount') as HTMLInputElement;
    await user.click(totalInput);
    await user.clear(totalInput);
    await user.type(totalInput, '100');

    // Add category with matching limit
    await user.click(screen.getByRole('button', { name: /add category/i }));
    const categorySelect = screen.getByLabelText('Category 1') as HTMLSelectElement;
    await user.selectOptions(categorySelect, testCategories[0].id);

    const limitInput = screen.getByLabelText('Limit 1') as HTMLInputElement;
    await user.click(limitInput);
    await user.clear(limitInput);
    await user.type(limitInput, '100');

    // Submit
    await user.click(screen.getByRole('button', { name: /add budget/i }));

    // Error should be displayed via FormAlert (role="alert")
    await waitFor(() => {
      expect(screen.getByText('Failed to create budget')).toBeInTheDocument();
    });
  });
});
