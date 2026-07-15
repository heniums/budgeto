import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createWallet, type WalletData } from '../api/wallets';
import { ApiError } from '../api/client';

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
  walletId: _walletId,
  onSuccess,
}: WalletModalProps): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1f8a4c');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreate = mode === 'create';

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const wallet = await createWallet({
        name: name.trim(),
        description: description.trim(),
        color,
      });
      onSuccess?.(wallet);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save wallet.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isCreate ? 'New Wallet' : mode === 'edit' ? 'Edit Wallet' : 'Wallet Details'}
          </SheetTitle>
        </SheetHeader>

        {isCreate && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-6">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-name">Name</Label>
              <Input
                id="wallet-modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-desc">Description</Label>
              <Input
                id="wallet-modal-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-modal-color">Color</Label>
              <input
                id="wallet-modal-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded-md border border-input cursor-pointer"
              />
            </div>

            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
