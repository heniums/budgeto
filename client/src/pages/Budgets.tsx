import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  getBudgets,
  deleteBudget,
  type BudgetData,
} from '../api/budgets';
import { getCategories, type CategoryData } from '../api/categories';
import { ApiError } from '../api/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetForm } from '../components/BudgetForm';
import { BudgetPeriodNav } from '../components/BudgetPeriodNav';
import { FormAlert } from '../components/FormAlert';

export function Budgets(): JSX.Element {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);
  const [period, setPeriod] = useState(() => dayjs().format('YYYY-MM'));

  const loadData = async (periodParam?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [budgetResult, categoryResult] = await Promise.all([
        getBudgets(periodParam),
        getCategories(),
      ]);
      setBudgets(budgetResult.budgets);
      setCategories(categoryResult.categories);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load budgets.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handleEdit = (budget: BudgetData): void => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteBudget(id);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete budget.');
      }
    }
  };

  const handleFormSuccess = (): void => {
    setEditingBudget(null);
    setDialogOpen(false);
    loadData();
  };

  const handleFormCancel = (): void => {
    setEditingBudget(null);
    setDialogOpen(false);
  };

  const handleOpenChange = (open: boolean): void => {
    setDialogOpen(open);
    if (!open) {
      setEditingBudget(null);
    }
  };

  const handleAddClick = (): void => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading budgets…</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Group spending limits across categories with a shared total.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>Add budget</Button>
          </DialogTrigger>
          {dialogOpen && (
            <BudgetForm
              editingBudget={editingBudget}
              categories={categories}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </Dialog>
      </div>

      {!dialogOpen && <FormAlert message={error} />}

      <BudgetPeriodNav period={period} onChange={setPeriod} />

      {budgets.length === 0 ? (
        <div className="rounded-md border p-6 text-center">
          <p className="text-muted-foreground">No budgets yet.</p>
          <p className="text-sm text-muted-foreground">
            Add a budget to start tracking your spending limits.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
