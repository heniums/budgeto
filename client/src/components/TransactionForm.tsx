import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTransaction, type WalletData } from '../api/wallets';
import { ApiError } from '../api/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
  categories?: { id: string; name: string; type: string; color: string }[];
  categoriesCount?: number;
  onSuccess: () => void;
  onCreateWallet?: () => void;
  onCreateCategory?: () => void;
  onViewWallet?: (walletId: string) => void;
  autoSelectWalletId?: string;
  autoSelectCategoryId?: string;
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
}: TransactionFormProps): JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
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

  const onSubmit = async (values: TransactionValues): Promise<void> => {
    setFormError(null);
    try {
      await createTransaction(values.walletId, {
        amount: values.amount,
        description: values.description,
        categoryId: values.categoryId || undefined,
      });
      reset();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {wallets.length === 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          You need a wallet to add a transaction.{' '}
          <span className="font-medium underline cursor-pointer">
            Create one →
          </span>
        </div>
      )}
      {wallets.length > 0 &&
        (categoriesCount ?? categories?.length ?? 0) === 0 && (
          <div
            role="alert"
            className="rounded-md border border-amber-500 bg-amber-50 p-3 text-sm text-amber-700"
          >
            You have no categories yet.{' '}
            <span className="font-medium underline cursor-pointer">
              Create one →
            </span>
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
        <Label htmlFor="tx-wallet">Wallet</Label>
        <select
          id="tx-wallet"
          {...register('walletId')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a wallet…</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
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
          <Label htmlFor="tx-category">Category</Label>
          <select
            id="tx-category"
            {...register('categoryId')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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

      <Button type="submit" disabled={isSubmitting || wallets.length === 0}>
        {isSubmitting ? 'Adding…' : 'Add Transaction'}
      </Button>
    </form>
  );
}
