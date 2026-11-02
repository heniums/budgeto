import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { type BudgetData, getBudget } from '../api/budgets';
import { ApiError } from '../api/client';
import { useBudgetsQuery } from '@/hooks/use-budgets';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useDialogParam } from '@/hooks/use-dialog-param';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateFinancialData } from '@/lib/queryClient';
import { budgetDetailKey } from '@/lib/queryKeys';
import { Button } from '@/components/memphis/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/memphis/dialog';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetCardSkeleton } from '../components/BudgetCardSkeleton';
import { BudgetForm } from '../components/BudgetForm';
import { BudgetPeriodNav } from '../components/BudgetPeriodNav';
import { FormAlert } from '../components/FormAlert';
import { FormSkeleton } from '../components/FormSkeleton';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export function Budgets(): JSX.Element {
  const queryClient = useQueryClient();
  const budgetDialog = useDialogParam('budget');
  const budgetParam = budgetDialog.value;
  const [period, setPeriod] = useState(() => dayjs().format('YYYY-MM'));
  // A deep-linked id ('?budget=<uuid>') fetches the budget directly; 'new'
  // opens the create form without a fetch.
  const editBudgetId =
    budgetParam !== null && budgetParam !== 'new' ? budgetParam : null;
  const budgetQuery = useQuery({
    queryKey: budgetDetailKey(editBudgetId ?? 'new'),
    queryFn: () => {
      if (editBudgetId === null) {
        throw new Error('editBudgetId missing');
      }
      return getBudget(editBudgetId);
    },
    enabled: editBudgetId !== null,
    retry: false,
    // Never background-refetch while the edit dialog is open: BudgetForm
    // repopulates whenever editingBudget's identity changes, so a refetch
    // would wipe in-progress edits. Cache invalidation after mutations
    // still refreshes it.
    staleTime: Infinity,
  });
  const editingBudget =
    budgetParam === 'new' ? null : (budgetQuery.data ?? null);
  const dialogOpen = budgetParam !== null;

  const {
    data: budgets = [],
    isPending: budgetsPending,
    error: budgetsError,
  } = useBudgetsQuery(period);
  const {
    data: categories = [],
    isPending: categoriesPending,
    error: categoriesError,
  } = useCategoriesQuery();
  const loading = budgetsPending || categoriesPending;
  const loadError = budgetsError ?? categoriesError;
  const errorMessage = loadError
    ? loadError instanceof ApiError
      ? loadError.message
      : 'Failed to load budgets.'
    : null;

  const handleEdit = (budget: BudgetData): void => {
    // Seed the cache so the dialog renders the form without a fetch round-trip.
    queryClient.setQueryData(budgetDetailKey(budget.id), budget);
    budgetDialog.open(budget.id);
  };
  const handleFormSuccess = (): void => {
    budgetDialog.close();
    // Budget create/update/delete can affect any cached period and the
    // dashboard's budget section.
    void invalidateFinancialData(queryClient);
  };

  const handleFormCancel = (): void => {
    budgetDialog.close();
  };

  const handleOpenChange = (open: boolean): void => {
    if (open) {
      budgetDialog.open('new');
    } else {
      budgetDialog.close();
    }
  };

  const handleAddClick = (): void => {
    budgetDialog.open();
  };

  // A deep-linked budget that no longer exists (deleted, or another user's)
  // must not wedge the edit dialog open. Replace (not push): a push would
  // let Back land on the stale link again, whose cached error closes it once
  // more — a trap the user cannot navigate past.
  useEffect(() => {
    if (budgetQuery.isError) {
      budgetDialog.close({ replace: true });
    }
  }, [budgetQuery.isError, budgetDialog.close]);

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
            {/* No onClick here: the trigger's own toggle calls
                handleOpenChange(true); adding one would push two identical
                history entries and Back would no longer close the dialog. */}
            <Button data-testid="header-add-button">Add budget</Button>
          </DialogTrigger>
          {budgetParam === 'new' || budgetQuery.data ? (
            <BudgetForm
              editingBudget={editingBudget}
              categories={categories}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              onDelete={() => {
                budgetDialog.close();
                void invalidateFinancialData(queryClient);
              }}
            />
          ) : budgetQuery.isPending ? (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit budget</DialogTitle>
              </DialogHeader>
              <FormSkeleton rows={6} />
            </DialogContent>
          ) : null}
        </Dialog>
      </div>

      {!dialogOpen && <FormAlert message={errorMessage} />}

      <BudgetPeriodNav period={period} onChange={setPeriod} />

      {loading && budgets.length === 0 ? (
        <div className="space-y-4">
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
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
              categoriesPending={categoriesPending}
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
