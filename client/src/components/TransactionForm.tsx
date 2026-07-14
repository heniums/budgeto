import { useState } from 'react';
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
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  wallets: WalletData[];
  categoriesCount?: number;
  onSuccess: () => void;
}

export function TransactionForm({
  wallets,
  onSuccess,
}: TransactionFormProps): JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { walletId: '', amount: '', description: '' },
  });

  const onSubmit = async (values: TransactionValues): Promise<void> => {
    setFormError(null);
    try {
      await createTransaction(values.walletId, {
        amount: values.amount,
        description: values.description,
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

      <div className="space-y-2">
        <Label htmlFor="tx-desc">Description</Label>
        <Input
          id="tx-desc"
          type="text"
          placeholder="e.g. Groceries"
          {...register('description')}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add Transaction'}
      </Button>
    </form>
  );
}
