import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTransaction, type WalletData } from '../api/wallets';
import {
  updateTransaction,
  type TransactionData,
} from '../api/transactions';
import { ApiError } from '../api/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WalletSelectList } from './WalletSelectList';
import { CategorySelectList } from './CategorySelectList';

const transactionSchema = z.object({
  walletId: z.string().min(1, 'Please select a wallet.'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => v !== '0' && !isNaN(Number(v)), {
      message: 'Amount must be a non-zero number.',
    }),
  description: z.string().max(512),
  categoryId: z.string().optional(),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  wallets: WalletData[];
  categories?: { id: string; name: string; type: 'income' | 'expense'; color: string; icon: string }[];
  categoriesCount?: number;
  onSuccess: () => void;
  onCreateWallet?: () => void;
  onCreateCategory?: () => void;
  onViewWallet?: (walletId: string) => void;
  autoSelectWalletId?: string;
  autoSelectCategoryId?: string;
  editMode?: boolean;
  initialValues?: {
    walletId: string;
    amount: string;
    description: string;
    categoryId: string;
  };
  editTxId?: string;
  onRefreshWallets?: () => void;
  onRefreshCategories?: () => void;
  viewMode?: boolean;
  viewTxId?: string;
  viewValues?: {
    walletId: string;
    amount: string;
    description: string;
    categoryId: string;
    walletName?: string;
    categoryName?: string;
    categoryColor?: string;
    createdAt?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onQuickChange?: () => void;
}

export function TransactionForm({
  wallets,
  categories,
  categoriesCount,
  onSuccess,
  onCreateWallet,
  onCreateCategory,
  onViewWallet,
  autoSelectWalletId,
  autoSelectCategoryId,
  editMode,
  initialValues,
  editTxId,
  onRefreshWallets,
  onRefreshCategories,
  viewMode,
  viewTxId,
  viewValues,
  onEdit,
  onDelete,
  onQuickChange,
}: TransactionFormProps): JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      walletId: '',
      amount: '',
      description: '',
      categoryId: '',
    },
  });

  const selectedWalletId = watch('walletId');

  useEffect(() => {
    if (autoSelectWalletId) {
      setValue('walletId', autoSelectWalletId);
    }
  }, [autoSelectWalletId, setValue]);

  useEffect(() => {
    if (autoSelectCategoryId) {
      setValue('categoryId', autoSelectCategoryId);
    }
  }, [autoSelectCategoryId, setValue]);

  useEffect(() => {
    if (editMode && initialValues) {
      setValue('walletId', initialValues.walletId);
      setValue('amount', initialValues.amount);
      setValue('description', initialValues.description);
      setValue('categoryId', initialValues.categoryId);
    }
  }, [editMode, initialValues, setValue]);

  const onSubmit = async (values: TransactionValues): Promise<void> => {
    setFormError(null);
    try {
      if (editMode && editTxId) {
        const updated: TransactionData = await updateTransaction(editTxId, {
          amount: values.amount,
          description: values.description,
          categoryId: values.categoryId || undefined,
          walletId: values.walletId,
        });
        reset({
          walletId: updated.walletId,
          amount: updated.amount,
          description: updated.description,
          categoryId: updated.categoryId ?? '',
        });
      } else {
        await createTransaction(values.walletId, {
          amount: values.amount,
          description: values.description,
          categoryId: values.categoryId || undefined,
        });
        reset();
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred.');
      }
    }
  };

  const handleQuickWalletChange = async (id: string): Promise<void> => {
    if (!viewTxId || !viewValues) return;
    setFormError(null);
    try {
      await updateTransaction(viewTxId, {
        walletId: id,
        amount: viewValues.amount,
        description: viewValues.description,
        categoryId: viewValues.categoryId || undefined,
      });
      onQuickChange?.();
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to update.');
    }
  };

  const handleQuickCategoryChange = async (id: string): Promise<void> => {
    if (!viewTxId || !viewValues) return;
    setFormError(null);
    try {
      await updateTransaction(viewTxId, {
        walletId: viewValues.walletId,
        amount: viewValues.amount,
        description: viewValues.description,
        categoryId: id || undefined,
      });
      onQuickChange?.();
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to update.');
    }
  };

  // View mode: read-only display with interactive chip lists
  if (viewMode && viewValues) {
    return (
      <div className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        {viewValues.createdAt && (
          <div>
            <span className="text-sm text-muted-foreground">Date</span>
            <p className="text-sm font-medium">
              {new Date(viewValues.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Wallet</Label>
          <WalletSelectList
            wallets={wallets}
            selectedId={viewValues.walletId || null}
            onSelect={handleQuickWalletChange}
            onRefresh={onRefreshWallets}
          />
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <p className={`text-lg font-semibold ${
            Number(viewValues.amount) < 0 ? 'text-destructive' : 'text-foreground'
          }`}>
            {Number(viewValues.amount) < 0 ? '-' : ''}$
            {Math.abs(Number(viewValues.amount)).toFixed(2)}
          </p>
        </div>

        {categories && categories.length > 0 && (
          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelectList
              categories={categories}
              selectedId={viewValues.categoryId || null}
              onSelect={handleQuickCategoryChange}
              onRefresh={onRefreshCategories}
            />
          </div>
        )}

        <div>
          <span className="text-sm text-muted-foreground">Description</span>
          <p className="text-sm font-medium">
            {viewValues.description || '—'}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button onClick={onEdit} variant="default">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button onClick={onDelete} variant="destructive">
              Delete
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {wallets.length === 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          You need a wallet to add a transaction.{' '}
          {onCreateWallet ? (
            <span
              className="font-medium underline cursor-pointer"
              onClick={onCreateWallet}
              role="button"
            >
              Create one →
            </span>
          ) : (
            <span className="font-medium underline cursor-pointer">
              Create one →
            </span>
          )}
        </div>
      )}
      {wallets.length > 0 &&
        (categoriesCount ?? categories?.length ?? 0) === 0 && (
          <div
            role="alert"
            className="rounded-md border border-amber-500 bg-amber-50 p-3 text-sm text-amber-700"
          >
            You have no categories yet.{' '}
            {onCreateCategory ? (
              <span
                className="font-medium underline cursor-pointer"
                onClick={onCreateCategory}
                role="button"
              >
                Create one →
              </span>
            ) : (
              <span className="font-medium underline cursor-pointer">
                Create one →
              </span>
            )}
          </div>
        )}
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="space-y-2">
        <Label>Wallet</Label>
        <WalletSelectList
          wallets={wallets}
          selectedId={selectedWalletId || null}
          onSelect={(id) => setValue('walletId', id, { shouldValidate: true, shouldDirty: true })}
          onRefresh={onRefreshWallets}
        />
        {errors.walletId && (
          <span role="alert" className="text-sm text-destructive">
            {errors.walletId.message}
          </span>
        )}
        {onCreateWallet && (
          <span
            className="text-xs text-muted-foreground underline cursor-pointer"
            onClick={onCreateWallet}
            role="button"
          >
            Don&apos;t see your wallet? Create one →
          </span>
        )}
        {onViewWallet && selectedWalletId && (
          <span
            className="text-xs text-muted-foreground underline cursor-pointer"
            onClick={() => onViewWallet(selectedWalletId)}
            role="button"
          >
            View wallet details
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-amount">Amount</Label>
        <Input
          id="tx-amount"
          type="text"
          inputMode="decimal"
          placeholder="-50.00 or 100.00"
          {...register('amount')}
        />
        {errors.amount && (
          <span role="alert" className="text-sm text-destructive">
            {errors.amount.message}
          </span>
        )}
      </div>

      {/* Category selector */}
      {categories && categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category</Label>
          <CategorySelectList
            categories={categories}
            selectedId={watch('categoryId') || null}
            onSelect={(id) => setValue('categoryId', id, { shouldValidate: true, shouldDirty: true })}
            onRefresh={onRefreshCategories}
          />
          {onCreateCategory && (
            <span
              className="text-xs text-muted-foreground underline cursor-pointer"
              onClick={onCreateCategory}
              role="button"
            >
              Don&apos;t see your category? Create one →
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tx-desc">Description</Label>
        <Input
          id="tx-desc"
          type="text"
          placeholder="e.g. Groceries"
          {...register('description')}
        />
        {!categories && onCreateCategory && (
          <span
            className="text-xs text-muted-foreground underline cursor-pointer"
            onClick={onCreateCategory}
            role="button"
          >
            Don&apos;t see your category? Create one →
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            wallets.length === 0 ||
            (editMode && !isDirty)
          }
        >
          {isSubmitting
            ? editMode
              ? 'Saving…'
              : 'Adding…'
            : editMode
              ? 'Save changes'
              : 'Add Transaction'}
        </Button>
        {editMode && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
