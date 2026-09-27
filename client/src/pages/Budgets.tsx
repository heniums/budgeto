import { useState } from 'react';
import dayjs from 'dayjs';
import { type BudgetData } from '../api/budgets';
import { ApiError } from '../api/client';
import { useBudgetsQuery } from '@/hooks/use-budgets';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateFinancialData } from '@/lib/queryClient';
import { Button } from '@/components/memphis/button';
import { Dialog, DialogTrigger } from '@/components/memphis/dialog';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetForm } from '../components/BudgetForm';
import { BudgetPeriodNav } from '../components/BudgetPeriodNav';
import { FormAlert } from '../components/FormAlert';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export function Budgets(): JSX.Element {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);
  const [period, setPeriod] = useState(() => dayjs().format('YYYY-MM'));

  const {
    data: budgets = [],
    isPending: budgetsPending,
    error: budgetsError,
  } = useBudgetsQuery(period);
  const { data: categories = [], isPending: categoriesPending, error: categoriesError } =
    useCategoriesQuery();
  const loading = budgetsPending || categoriesPending;
  const loadError = budgetsError ?? categoriesError;
  const errorMessage = loadError
    ? loadError instanceof ApiError
      ? loadError.message
      : 'Failed to load budgets.'
    : null;

  const handleEdit = (budget: BudgetData): void => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };
  const handleFormSuccess = (): void => {
    setEditingBudget(null);
    setDialogOpen(false);
    // Budget create/update/delete can affect any cached period and the
    // dashboard's budget section.
    void invalidateFinancialData(queryClient);
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

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Group spending limits across categories with a shared total.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="header-add-button" onClick={handleAddClick}>Add budget</Button>
          </DialogTrigger>
          {dialogOpen && (
            <BudgetForm
              editingBudget={editingBudget}
              categories={categories}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              onDelete={() => {
                setEditingBudget(null);
                setDialogOpen(false);
                void invalidateFinancialData(queryClient);
              }}
            />
          )}
        </Dialog>
      </div>

      {!dialogOpen && <FormAlert message={errorMessage} />}

      <BudgetPeriodNav period={period} onChange={setPeriod} />

      {loading && budgets.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="memphis-card rounded-2xl p-6 text-center">
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
              onClick={() => handleEdit(budget)}
            />
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <FloatingActionButton onClick={handleAddClick} label="Add budget" />
      )}
    </div>
  );
}
