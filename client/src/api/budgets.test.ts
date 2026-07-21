import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  return { mockGet, mockPost, mockPut, mockDelete };
});

vi.mock('./client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

import {
  getBudget,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from './budgets';
import { ApiError } from './client';

const budgetData = {
  id: 'b1',
  userId: 'u1',
  name: 'Monthly Budget',
  icon: 'wallet',
  color: '#1f8a4c',
  period: 'monthly' as const,
  periodWindow: { startDate: '2024-03-01', endDate: '2024-03-31' },
  totalAmount: '1000.00',
  spent: '50.00',
  remaining: '950.00',
  percentage: 5,
  categories: [
    {
      categoryId: 'c1',
      categoryName: 'Groceries',
      categoryColor: '#ff5733',
      categoryIcon: 'ShoppingCart',
      limitAmount: '500.00',
      spent: '50.00',
      remaining: '450.00',
      percentage: 10,
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('budgets API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getBudget sends GET for single budget without period param', async () => {
    mockGet.mockResolvedValue({ data: budgetData });
    const budget = await getBudget('b1');
    expect(mockGet).toHaveBeenCalledWith('/budgets/b1');
    expect(budget.name).toBe('Monthly Budget');
    expect(budget.id).toBe('b1');
  });

  it('getBudget sends GET with period query param', async () => {
    mockGet.mockResolvedValue({ data: budgetData });
    const budget = await getBudget('b1', '2024-03');
    expect(mockGet).toHaveBeenCalledWith('/budgets/b1?period=2024-03');
    expect(budget.periodWindow.startDate).toBe('2024-03-01');
  });

  it('getBudgets sends GET to list endpoint', async () => {
    mockGet.mockResolvedValue({ data: { budgets: [budgetData] } });
    const result = await getBudgets();
    expect(mockGet).toHaveBeenCalledWith('/budgets');
    expect(result.budgets).toHaveLength(1);
  });

  it('getBudgets sends GET with period query param', async () => {
    mockGet.mockResolvedValue({ data: { budgets: [budgetData] } });
    await getBudgets('2024-03');
    expect(mockGet).toHaveBeenCalledWith('/budgets?period=2024-03');
  });

  it('createBudget sends POST', async () => {
    mockPost.mockResolvedValue({ data: budgetData });
    const budget = await createBudget({
      name: 'Monthly Budget',
      totalAmount: '1000.00',
      categories: [{ categoryId: 'c1', limitAmount: '500.00' }],
    });
    expect(mockPost).toHaveBeenCalledWith('/budgets', expect.any(Object));
    expect(budget.name).toBe('Monthly Budget');
  });

  it('updateBudget sends PUT', async () => {
    mockPut.mockResolvedValue({ data: budgetData });
    const budget = await updateBudget('b1', { name: 'Updated' });
    expect(mockPut).toHaveBeenCalledWith('/budgets/b1', { name: 'Updated' });
    expect(budget.name).toBe('Monthly Budget');
  });

  it('deleteBudget sends DELETE', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await expect(deleteBudget('b1')).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalledWith('/budgets/b1');
  });

  it('throws ApiError on errors', async () => {
    const apiError = new ApiError('Not found', 404, 'NOT_FOUND');
    mockGet.mockRejectedValue(apiError);
    await expect(getBudget('bad-id')).rejects.toBeInstanceOf(ApiError);
  });
});
