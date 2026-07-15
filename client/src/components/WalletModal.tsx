import { useEffect, useState } from 'react';
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1f8a4c');
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      setLoading(false);
      setWallet(null);
      setName('');
      setDescription('');
      setColor('#1f8a4c');
      setError(null);
      return;
    }

    if (!walletId) return;

    let active = true;
    setLoading(true);
    setError(null);

    const fetches: Promise<void>[] = [
      getWallet(walletId).then((w) => {
        if (!active) return;
        setWallet(w);
        setName(w.name);
        setDescription(w.description);
        setColor(w.color);
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
        setError('Failed to load wallet.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, walletId, isCreate, isView]);

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
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

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!walletId) return;
    setError(null);
    setSaving(true);
    try {
      await updateWallet(walletId, {
        name: name.trim(),
        description: description.trim(),
        color,
      });
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save wallet.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!walletId) return;
    setError(null);
    setSaving(true);
    try {
      await deleteWallet(walletId);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to delete wallet.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = isCreate ? handleCreate : handleUpdate;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isCreate ? 'New Wallet' : mode === 'edit' ? 'Edit Wallet' : 'Wallet Details'}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <p className="text-muted-foreground mt-4">Loading…</p>
        )}

        {!loading && isCreate && (
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

        {!loading && isEdit && (
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

            <div className="flex justify-between gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                type="button"
              >
                Delete
              </Button>
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
                  disabled={saving || !name.trim()}
                >
                  {saving ? 'Saving…' : 'Save'}
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

        {!loading && isView && error && (
          <p className="text-destructive mt-4">{error}</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
