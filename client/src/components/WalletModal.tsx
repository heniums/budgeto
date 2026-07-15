import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  createWallet,
  getWallet,
  updateWallet,
  deleteWallet,
  type WalletData,
} from '../api/wallets';
import {
  getTransactions,
  type TransactionData,
} from '../api/transactions';
import { ApiError } from '../api/client';
import { DEFAULT_COLOR, MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, LABEL, ERR, SHEET_SIDE, SHEET_WIDTH } from '../lib/constants';

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(MAX_NAME_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH),
  color: z.string(),
});

type WalletFormValues = z.infer<typeof walletSchema>;

export interface WalletModalProps {
  mode: 'create' | 'edit' | 'view';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId?: string;
  onSuccess?: (wallet?: WalletData) => void;
}

export function WalletModal({
  mode,
  open,
  onOpenChange,
  walletId,
  onSuccess,
}: WalletModalProps): JSX.Element {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: '', description: '', color: DEFAULT_COLOR },
  });

  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      setWallet(null);
      reset({ name: '', description: '', color: DEFAULT_COLOR });
      setFormError(null);
      return;
    }

    if (!walletId) return;

    let active = true;
    setLoading(true);
    setFormError(null);

    const fetches: Promise<void>[] = [
      getWallet(walletId).then((w) => {
        if (!active) return;
        setWallet(w);
        reset({
          name: w.name,
          description: w.description,
          color: w.color,
        });
      }),
    ];

    if (isView) {
      fetches.push(
        getTransactions().then((result) => {
          if (!active) return;
          setTransactions(
            result.transactions.filter((tx) => tx.walletId === walletId),
          );
        }),
      );
    }

    Promise.all(fetches)
      .then(() => {
        if (!active) return;
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
  }, [open, walletId, isCreate, isView, reset]);

  const onCreate = async (values: WalletFormValues): Promise<void> => {
    setFormError(null);
    try {
      const w = await createWallet({
        name: values.name.trim(),
        description: values.description.trim(),
        color: values.color,
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

  const title = isCreate
    ? 'New Wallet'
    : isEdit
      ? 'Edit Wallet'
      : 'Wallet Details';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={SHEET_SIDE} className={SHEET_WIDTH}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {loading && (
          <p className="text-muted-foreground mt-4">Loading…</p>
        )}

        {!loading && (isCreate || isEdit) && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 mt-6"
          >
            {formError && (
              <div
                role="alert"
                className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-name">{LABEL.NAME}</Label>
              <Input
                id="wallet-modal-name"
                type="text"
                {...register('name')}
              />
              {errors.name && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-desc">{LABEL.DESCRIPTION}</Label>
              <Input
                id="wallet-modal-desc"
                type="text"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-color">{LABEL.COLOR}</Label>
              <Input
                id="wallet-modal-color"
                type="color"
                {...register('color')}
              />
            </div>

            <div
              className={`flex ${isEdit ? 'justify-between' : 'justify-end'} gap-2`}
            >
              {isEdit && (
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
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? isCreate
                      ? 'Creating…'
                      : 'Saving…'
                    : isCreate
                      ? 'Create'
                      : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {!loading && isView && wallet && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-6 rounded-full shrink-0"
                style={{ backgroundColor: wallet.color }}
                aria-hidden
              />
              <div>
                <p className="font-semibold text-lg">{wallet.name}</p>
                {wallet.description && (
                  <p className="text-sm text-muted-foreground">
                    {wallet.description}
                  </p>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold">{wallet.balance}</p>

            {transactions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Transactions
                </p>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center py-1 border-b text-sm"
                  >
                    <span>
                      {tx.description || '—'}
                      <span className="text-muted-foreground ml-2">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span
                      className={
                        Number(tx.amount) < 0
                          ? 'text-destructive'
                          : 'text-foreground'
                      }
                    >
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No transactions yet.
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        )}

        {!loading && isView && formError && (
          <p className="text-destructive mt-4">{formError}</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
