import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createWallet,
  getWallet,
  updateWallet,
  deleteWallet,
  type WalletData,
} from '../api/wallets';
import { ApiError } from '../api/client';
import { FormError } from './FormError';
import { FormAlert } from './FormAlert';
import {
  DEFAULT_COLOR,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  LABEL,
  ERR,
} from '../lib/constants';
import { detectLocaleCurrency } from '../lib/currencies';
import { MoneyInput } from './MoneyInput';
import { ColorInput } from './ColorInput';
import { CurrencyInput } from './CurrencyInput';

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(MAX_NAME_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH),
  color: z.string(),
  currency: z.string(),
  balance: z
    .string()
    .refine(
      (val) => val === '' || Number.isFinite(Number(val)),
      'Balance must be a valid number.',
    ),
});

type WalletFormValues = z.infer<typeof walletSchema>;

export interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId?: string;
  onSuccess?: (wallet?: WalletData) => void;
}

export function WalletModal({
  open,
  onOpenChange,
  walletId,
  onSuccess,
}: WalletModalProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: '',
      description: '',
      color: DEFAULT_COLOR,
      currency: detectLocaleCurrency(),
      balance: '0',
    },
  });

  const isCreate = !walletId;

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      reset({
        name: '',
        description: '',
        color: DEFAULT_COLOR,
        currency: detectLocaleCurrency(),
        balance: '0',
      });
      setFormError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setFormError(null);

    getWallet(walletId)
      .then((w) => {
        if (!active) return;
        reset({
          name: w.name,
          description: w.description,
          color: w.color,
          currency: w.currency,
          balance: w.balance,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFormError(ERR.FAILED_TO_LOAD('wallet'));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, walletId, isCreate, reset]);

  const onCreate = async (values: WalletFormValues): Promise<void> => {
    setFormError(null);
    try {
      const w = await createWallet({
        name: values.name.trim(),
        description: values.description.trim(),
        color: values.color,
        currency: values.currency,
        balance: values.balance.trim(),
      });
      onSuccess?.(w);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : ERR.FAILED_TO_SAVE('wallet'),
      );
    }
  };

  const onUpdate = async (values: WalletFormValues): Promise<void> => {
    if (!walletId) return;
    setFormError(null);
    try {
      await updateWallet(walletId, {
        name: values.name.trim(),
        description: values.description.trim(),
        color: values.color,
        currency: values.currency,
        balance: values.balance.trim(),
      });
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : ERR.FAILED_TO_SAVE('wallet'),
      );
    }
  };

  const onSubmit = isCreate ? onCreate : onUpdate;

  const handleDelete = async (): Promise<void> => {
    if (!walletId) return;
    setFormError(null);
    try {
      await deleteWallet(walletId);
      onSuccess?.();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : ERR.FAILED_TO_DELETE('wallet'),
      );
    }
  };

  const title = isCreate ? 'New Wallet' : 'Edit Wallet';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-muted-foreground mt-4">Loading…</p>}

        {!loading && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 mt-6"
          >
            <FormAlert message={formError} />

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-name">{LABEL.NAME}</Label>
              <Input
                id="wallet-modal-name"
                type="text"
                placeholder="e.g. Savings"
                {...register('name')}
              />
              <FormError message={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-desc">{LABEL.DESCRIPTION}</Label>
              <Input
                id="wallet-modal-desc"
                type="text"
                placeholder="Optional description"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-color">{LABEL.COLOR}</Label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <ColorInput
                    id="wallet-modal-color"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="wallet-modal-currency"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-balance">
                {isCreate ? 'Initial Balance' : 'Balance'}
              </Label>
              <Controller
                name="balance"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="wallet-modal-balance"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    currency={watch('currency')}
                  />
                )}
              />
              <FormError message={errors.balance?.message} />
            </div>

            <div
              className={`flex ${!isCreate ? 'justify-between' : 'justify-end'} gap-2`}
            >
              {!isCreate && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  type="button"
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (!isCreate && !isDirty)}
                >
                  {isSubmitting
                    ? isCreate
                      ? 'Creating…'
                      : 'Saving…'
                    : isCreate
                      ? 'Create'
                      : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
