import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTransaction, type WalletData, ApiError } from '../api/wallets';

const transactionSchema = z.object({
  walletId: z.string().min(1, 'Please select a wallet.'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => v !== '0' && !isNaN(Number(v)), {
      message: 'Amount must be a non-zero number.',
    }),
  description: z.string().max(512).optional().default(''),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  wallets: WalletData[];
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError && (
        <div role="alert" className="form-error">
          {formError}
        </div>
      )}

      <div className="field">
        <label htmlFor="tx-wallet">Wallet</label>
        <select id="tx-wallet" {...register('walletId')}>
          <option value="">Select a wallet…</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {errors.walletId && (
          <span role="alert" className="field-error">
            {errors.walletId.message}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="tx-amount">Amount</label>
        <input
          id="tx-amount"
          type="text"
          inputMode="decimal"
          placeholder="-50.00 or 100.00"
          {...register('amount')}
        />
        {errors.amount && (
          <span role="alert" className="field-error">
            {errors.amount.message}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="tx-desc">Description</label>
        <input
          id="tx-desc"
          type="text"
          placeholder="e.g. Groceries"
          {...register('description')}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add Transaction'}
      </button>
    </form>
  );
}
