import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { createTransaction, type WalletData } from '../api/wallets';
import { updateTransaction, type TransactionData } from '../api/transactions';
import { ApiError } from '../api/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WalletSelectList } from './WalletSelectList';
import { CategorySelectList } from './CategorySelectList';
import { Money } from './Money';
import { FormError } from './FormError';
import { FormAlert } from './FormAlert';

import { MoneyInput } from './MoneyInput';
const transactionSchema = z.object({
  walletId: z.string().min(1, 'Please select a wallet.'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => v !== '0' && !isNaN(Number(v)) && Number(v) > 0, {
      message: 'Amount must be a positive number.',
    }),
  type: z.enum(['income', 'expense']),
  description: z.string().max(512),
  categoryId: z.string().min(1, 'Please select a category.'),
  date: z.string().min(1, 'Date is required.'),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  wallets: WalletData[];
  categories?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }[];
  categoriesCount?: number;
  onSuccess: (tx?: TransactionData) => void;
  onCreateWallet?: () => void;
  onCreateCategory?: () => void;
  onViewWallet?: (walletId: string) => void;
  onEditWallet?: (wallet: {
    id: string;
    name: string;
    color: string;
    description: string;
  }) => void;
  onEditCategory?: (category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }) => void;
  autoSelectWalletId?: string;
  autoSelectCategoryId?: string;
  editMode?: boolean;
  initialValues?: {
    walletId: string;
    amount: string;
    description: string;
    categoryId: string;
    date: string;
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
    date?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onQuickChange?: () => void;
  onClose?: () => void;
}

export function TransactionForm({
  wallets,
  categories,
  categoriesCount,
  onSuccess,
  onCreateWallet,
  onCreateCategory,
  onViewWallet,
  onEditWallet,
  onEditCategory,
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
  onClose,
}: TransactionFormProps): JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      walletId: '',
      amount: '',
      type: 'expense',
      description: '',
      categoryId: '',
      date: dayjs().format('YYYY-MM-DDTHH:mm'),
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
      const absAmount = initialValues.amount.startsWith('-') ? initialValues.amount.slice(1) : initialValues.amount;
      setValue('amount', absAmount);
      setValue('type', Number(initialValues.amount) < 0 ? 'expense' : 'income');
      setValue('description', initialValues.description);
      setValue('categoryId', initialValues.categoryId);
      setValue('date', dayjs(initialValues.date).format('YYYY-MM-DDTHH:mm'));
    }
  }, [editMode, initialValues, setValue]);

  const onSubmit = async (values: TransactionValues): Promise<void> => {
    setFormError(null);
    const isoDate = dayjs(values.date).toISOString();
    const signedAmount = values.type === 'expense' ? '-' + values.amount : values.amount;
    try {
      if (editMode && editTxId) {
        const updated: TransactionData = await updateTransaction(editTxId, {
          amount: signedAmount,
          description: values.description,
          categoryId: values.categoryId || undefined,
          walletId: values.walletId,
          date: isoDate,
        });
        reset({
          walletId: updated.walletId,
          amount: String(updated.amount).startsWith('-') ? String(updated.amount).slice(1) : String(updated.amount),
          type: Number(updated.amount) < 0 ? 'expense' : 'income',
          description: updated.description,
          categoryId: updated.categoryId ?? '',
          date: dayjs(updated.date ?? isoDate).format('YYYY-MM-DDTHH:mm'),
        });
        onSuccess(updated);
      } else {
        const created = await createTransaction(values.walletId, {
          amount: signedAmount,
          description: values.description,
          categoryId: values.categoryId || undefined,
          date: isoDate,
        });
        reset({
          walletId: '',
          amount: '',
          type: 'expense',
          description: '',
          categoryId: '',
          date: dayjs().format('YYYY-MM-DDTHH:mm'),
        });
        const txWithData: TransactionData = {
          ...created,
          categoryName: null,
        };
        onSuccess(txWithData);
      }
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
      <div className="space-y-4 min-w-0">
        <FormAlert message={formError} />

        {viewValues.date && (
          <div>
            <span className="text-sm text-muted-foreground">Date</span>
            <p className="text-sm font-medium">
              {dayjs(viewValues.date).format('M/D/YYYY h:mm A')}
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
            onEdit={onEditWallet}
          />
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <p className="text-lg font-semibold">
            <Money
              amount={viewValues.amount}
              currency={
                wallets.find((w) => w.id === viewValues.walletId)?.currency ??
                'USD'
              }
            />
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
              onEdit={onEditCategory}
            />
          </div>
        )}

        <div>
          <span className="text-sm text-muted-foreground">Description</span>
          <p className="text-sm font-medium">{viewValues.description || '—'}</p>
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 min-w-0">
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
      <FormAlert message={formError} />

      <div className="space-y-2">
        <Label>Wallet</Label>
        <WalletSelectList
          wallets={wallets}
          selectedId={selectedWalletId || null}
          onSelect={(id) =>
            setValue('walletId', id, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          onRefresh={onRefreshWallets}
          onEdit={onEditWallet}
        />
        <FormError message={errors.walletId?.message} />
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
        <Label>Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={watch('type') === 'income' ? 'default' : 'outline'}
            className={watch('type') === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={() => setValue('type', 'income', { shouldDirty: true })}
          >
            Income
          </Button>
          <Button
            type="button"
            variant={watch('type') === 'expense' ? 'default' : 'outline'}
            className={watch('type') === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
            onClick={() => setValue('type', 'expense', { shouldDirty: true })}
          >
            Expense
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-amount">Amount</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <MoneyInput
              id="tx-amount"
              currency={
                wallets.find((w) => w.id === selectedWalletId)?.currency ??
                'USD'
              }
              placeholder="0.00"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <FormError message={errors.amount?.message} />
      </div>

      {/* Category selector */}
      {categories && categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category</Label>
          <CategorySelectList
            categories={categories}
            selectedId={watch('categoryId') || null}
            onSelect={(id) =>
              setValue('categoryId', id, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            onRefresh={onRefreshCategories}
            onEdit={onEditCategory}
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

      <div className="space-y-2">
        <Label htmlFor="tx-date">Date</Label>
        <Input id="tx-date" type="datetime-local" {...register('date')} />
        <FormError message={errors.date?.message} />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={
            isSubmitting || wallets.length === 0 || (editMode && !isDirty)
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
        {editMode ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : (
          onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          )
        )}
      </div>
      {editMode && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-muted-foreground hover:text-destructive underline mt-1"
        >
          Delete this transaction
        </button>
      )}
    </form>
  );
}
