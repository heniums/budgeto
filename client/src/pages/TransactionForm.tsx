import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTransaction } from '../api/transactions';
import { getWallets, type WalletData } from '../api/wallets';
import { getCategories, type CategoryData } from '../api/categories';
import { ApiError } from '../api/client';

const transactionSchema = z.object({
  walletId: z.string().min(1, 'Please select a wallet.'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => v !== '0' && !isNaN(Number(v)), {
      message: 'Amount must be a non-zero number.',
    }),
  description: z.string().max(512).optional().default(''),
  categoryId: z.string().uuid().optional().or(z.literal('')),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  wallets?: WalletData[];
  defaultWalletId?: string;
  onSuccess?: () => void;
}

export function TransactionForm({
  wallets: providedWallets,
  defaultWalletId,
  onSuccess,
}: TransactionFormProps): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>(providedWallets ?? []);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(!providedWallets);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (providedWallets) return;
    let active = true;
    Promise.all([getWallets(), getCategories()])
      .then(([walletRes, categoryRes]) => {
        if (!active) return;
        setWallets(walletRes.wallets);
        setCategories(categoryRes.categories);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [providedWallets]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      walletId: defaultWalletId ?? '',
      amount: '',
      description: '',
      categoryId: '',
    },
  });

  const onSubmit = async (values: TransactionValues): Promise<void> => {
    setFormError(null);
    try {
      await createTransaction(values.walletId, {
        amount: values.amount,
        description: values.description,
        categoryId: values.categoryId ? values.categoryId : undefined,
      });
      reset({
        walletId: values.walletId,
        amount: '',
        description: '',
        categoryId: '',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/account/wallets/${values.walletId}/transactions`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred.');
      }
    }
  };

  const backTo = id
    ? `/account/wallets/${id}/transactions`
    : '/account/wallets';

  return (
    <main>
      <h1>New Transaction</h1>

      <Link to={backTo}>Back</Link>

      {formError && (
        <div role="alert" className="form-error">
          {formError}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ marginTop: '1rem' }}
        >
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
            <label htmlFor="tx-category">Category</label>
            <select id="tx-category" {...register('categoryId')}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
      )}
    </main>
  );
}
