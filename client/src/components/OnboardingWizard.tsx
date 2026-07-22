import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { createWallet } from '../api/wallets';
import { createCategory, type CategoryData } from '../api/categories';
import { ApiError } from '../api/client';
import { detectLocaleCurrency } from '../lib/currencies';
import { Button } from '@/components/ui/button';
import { FormError } from './FormError';
import { FormAlert } from './FormAlert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const walletSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(128),
  type: z.enum(['income', 'expense']),
});

type WalletValues = z.infer<typeof walletSchema>;
type CategoryValues = z.infer<typeof categorySchema>;

export interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: { walletId: string; categoryId: string }) => void;
}

export function OnboardingWizard({
  open,
  onOpenChange,
  onComplete,
}: OnboardingWizardProps): JSX.Element {
  const [step, setStep] = useState(1);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const walletForm = useForm<WalletValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: '' },
  });

  const categoryForm = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: 'expense' },
  });

  const handleDismiss = (): void => {
    try {
      localStorage.setItem('budgeto:wizardDismissed', 'true');
    } catch {
      // localStorage unavailable — silently ignore
    }
    onOpenChange(false);
  };

  const handleCreateWallet = async (values: WalletValues): Promise<void> => {
    setFormError(null);
    try {
      const wallet = await createWallet({
        name: values.name.trim(),
        description: '',
        color: '#1f8a4c',
        currency: detectLocaleCurrency(),
      });
      setWalletId(wallet.id);
      setStep(2);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to create wallet.',
      );
    }
  };

  const handleCreateCategory = async (
    values: CategoryValues,
  ): Promise<void> => {
    setFormError(null);
    try {
      const category: CategoryData = await createCategory({
        name: values.name.trim(),
        type: values.type,
        color: '#ff6b6b',
        icon: 'Tag',
      });
      setStep(3);
      // Store category ID for onComplete
      if (walletId) {
        onComplete({ walletId, categoryId: category.id });
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to create category.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Step {step} of 3</p>

        <FormAlert message={formError} />

        {step === 1 && (
          <form
            onSubmit={walletForm.handleSubmit(handleCreateWallet)}
            noValidate
            className="space-y-4"
          >
            <p className="text-sm">
              Let&apos;s start by creating your first wallet.
            </p>
            <div className="space-y-2">
              <Label htmlFor="wiz-wallet-name">Wallet name</Label>
              <Input
                id="wiz-wallet-name"
                type="text"
                placeholder="e.g. Cash, Bank Account"
                {...walletForm.register('name')}
              />
              <FormError message={walletForm.formState.errors.name?.message} />
            </div>
            <Button
              type="submit"
              disabled={walletForm.formState.isSubmitting}
              className="w-full"
            >
              {walletForm.formState.isSubmitting
                ? 'Creating...'
                : 'Create Wallet'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={categoryForm.handleSubmit(handleCreateCategory)}
            noValidate
            className="space-y-4"
          >
            <p className="text-sm">
              Now create a category to organize your spending.
            </p>
            <div className="space-y-2">
              <Label htmlFor="wiz-cat-name">Category name</Label>
              <Input
                id="wiz-cat-name"
                type="text"
                placeholder="e.g. Food, Rent"
                {...categoryForm.register('name')}
              />
              <FormError message={categoryForm.formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    value="expense"
                    {...categoryForm.register('type')}
                  />
                  Expense
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    value="income"
                    {...categoryForm.register('type')}
                  />
                  Income
                </label>
              </div>
            </div>
            <Button
              type="submit"
              disabled={categoryForm.formState.isSubmitting}
              className="w-full"
            >
              {categoryForm.formState.isSubmitting
                ? 'Creating...'
                : 'Create Category'}
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              You&apos;re all set! Start adding transactions on the Home page.
            </p>
            <Button className="w-full" onClick={handleDismiss}>
              Got it
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
