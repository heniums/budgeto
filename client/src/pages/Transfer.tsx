import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transferFunds } from '../api/transactions';
import { getWallets, type WalletData } from '../api/wallets';
import { ApiError } from '../api/client';

const transferSchema = z
  .object({
    sourceId: z.string().min(1, 'Select a source wallet.'),
    targetId: z.string().min(1, 'Select a target wallet.'),
    amount: z
      .string()
      .min(1, 'Amount is required.')
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
        message: 'Amount must be a positive number.',
      }),
    description: z.string().max(512).optional().default(''),
  })
  .refine((data) => data.sourceId !== data.targetId, {
    message: 'Source and target wallets must be different.',
    path: ['targetId'],
  });

type TransferValues = z.infer<typeof transferSchema>;

interface TransferFormProps {
  wallets?: WalletData[];
  defaultWalletId?: string;
  onSuccess?: () => void;
}

export function Transfer({
  wallets: providedWallets,
  defaultWalletId,
  onSuccess,
}: TransferFormProps): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>(providedWallets ?? []);
  const [loadingWallets, setLoadingWallets] = useState(!providedWallets);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (providedWallets) return;
    let active = true;
    getWallets()
      .then((res) => {
        if (!active) return;
        setWallets(res.wallets);
        setLoadingWallets(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadingWallets(false);
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
  } = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceId: defaultWalletId ?? '',
      targetId: '',
      amount: '',
      description: '',
    },
  });

  const onSubmit = async (values: TransferValues): Promise<void> => {
    setFormError(null);
    try {
      await transferFunds({
        sourceId: values.sourceId,
        targetId: values.targetId,
        amount: values.amount,
        description: values.description,
      });
      reset({
        sourceId: values.sourceId,
        targetId: '',
        amount: '',
        description: '',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/account/wallets');
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
      <h1>Transfer</h1>

      <Link to={backTo}>Back</Link>

      {formError && (
        <div role="alert" className="form-error">
          {formError}
        </div>
      )}

      {loadingWallets ? (
        <p>Loading…</p>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ marginTop: '1rem' }}
        >
          {formError && (
            <div role="alert" className="form-error">
              {formError}
            </div>
          )}

          <div className="field">
            <label htmlFor="transfer-from">From</label>
            <select id="transfer-from" {...register('sourceId')}>
              <option value="">Select source…</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {errors.sourceId && (
              <span role="alert" className="field-error">
                {errors.sourceId.message}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="transfer-to">To</label>
            <select id="transfer-to" {...register('targetId')}>
              <option value="">Select target…</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {errors.targetId && (
              <span role="alert" className="field-error">
                {errors.targetId.message}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="transfer-amount">Amount</label>
            <input
              id="transfer-amount"
              type="text"
              inputMode="decimal"
              placeholder="50.00"
              {...register('amount')}
            />
            {errors.amount && (
              <span role="alert" className="field-error">
                {errors.amount.message}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="transfer-desc">Description</label>
            <input
              id="transfer-desc"
              type="text"
              placeholder="e.g. Moving funds"
              {...register('description')}
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Transferring…' : 'Transfer'}
          </button>
        </form>
      )}
    </main>
  );
}
