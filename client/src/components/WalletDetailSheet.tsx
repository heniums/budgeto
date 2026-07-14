import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  createWallet,
  getWallet,
  updateWallet,
  type WalletData,
} from '../api/wallets';
import { ApiError } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const editSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
  description: z.string().max(512),
  color: z.string(),
});

type EditValues = z.infer<typeof editSchema>;

export interface WalletDetailSheetProps {
  walletId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newWallet?: WalletData) => void;
}

export function WalletDetailSheet({
  walletId,
  open,
  onOpenChange,
  onSuccess,
}: WalletDetailSheetProps): JSX.Element {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', description: '', color: '#1f8a4c' },
  });

  const isCreate = !walletId;

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      setWallet(null);
      reset({ name: '', description: '', color: '#1f8a4c' });
      return;
    }

    let active = true;
    setLoading(true);
    setFormError(null);
    getWallet(walletId)
      .then((w) => {
        if (!active) return;
        setWallet(w);
        reset({
          name: w.name,
          description: w.description,
          color: w.color,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFormError('Failed to load wallet.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, walletId, reset, isCreate]);

  const onSubmit = async (values: EditValues): Promise<void> => {
    setFormError(null);
    try {
      if (isCreate) {
        const newWallet = await createWallet({
          name: values.name.trim(),
          description: values.description.trim(),
          color: values.color,
        });
        onSuccess?.(newWallet);
      } else if (walletId) {
        await updateWallet(walletId, {
          name: values.name.trim(),
          description: values.description.trim(),
          color: values.color,
        });
        onSuccess?.();
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to save wallet.',
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isCreate ? 'New Wallet' : 'Wallet Details'}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <p className="text-muted-foreground mt-4">Loading…</p>
        ) : formError && !isCreate && !wallet ? (
          <p className="text-destructive mt-4">{formError}</p>
        ) : (
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
              <Label htmlFor="sheet-wallet-name">Name</Label>
              <Input id="sheet-wallet-name" type="text" {...register('name')} />
              {errors.name && (
                <span role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-wallet-desc">Description</Label>
              <Input
                id="sheet-wallet-desc"
                type="text"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheet-wallet-color">Color</Label>
              <Input
                id="sheet-wallet-color"
                type="color"
                {...register('color')}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && isCreate
                ? 'Creating…'
                : isSubmitting
                  ? 'Saving…'
                  : isCreate
                    ? 'Create'
                    : 'Save'}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
