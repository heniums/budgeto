import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transferFunds, type WalletData } from '../api/wallets';
import { ApiError } from '../api/client';
import { Input } from '@/components/ui/input';
import { FormError } from './FormError';
import { FormAlert } from './FormAlert';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MoneyInput } from './MoneyInput';

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
    description: z.string().max(512),
  })
  .refine((data) => data.sourceId !== data.targetId, {
    message: 'Source and target wallets must be different.',
    path: ['targetId'],
  });

type TransferValues = z.infer<typeof transferSchema>;

interface TransferFormProps {
  wallets: WalletData[];
  onSuccess: () => void;
}

export function TransferForm({
  wallets,
  onSuccess,
}: TransferFormProps): JSX.Element {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceId: '',
      targetId: '',
      amount: '',
      description: '',
    },
  });

  const sourceWalletId = watch('sourceId');


  const onSubmit = async (values: TransferValues): Promise<void> => {
    setFormError(null);
    try {
      await transferFunds({
        sourceId: values.sourceId,
        targetId: values.targetId,
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
      <FormAlert message={formError} />

      <div className="space-y-2">
        <Label htmlFor="transfer-from">From</Label>
        <select
          id="transfer-from"
          {...register('sourceId')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select source…</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <FormError message={errors.sourceId?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-to">To</Label>
        <select
          id="transfer-to"
          {...register('targetId')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select target…</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <FormError message={errors.targetId?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-amount">Amount</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <MoneyInput
              id="transfer-amount"
              currency={
                wallets.find((w) => w.id === sourceWalletId)?.currency ??
                'USD'
              }
              placeholder="50.00"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <FormError message={errors.amount?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-desc">Description</Label>
        <Input
          id="transfer-desc"
          type="text"
          placeholder="e.g. Moving funds"
          {...register('description')}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Transferring…' : 'Transfer'}
      </Button>
    </form>
  );
}
