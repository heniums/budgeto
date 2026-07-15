import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLongPress } from '../hooks/use-long-press';
import { updateWallet, createWallet, deleteWallet } from '../api/wallets';
import { Plus, Grid3X3 } from 'lucide-react';

interface WalletItem {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface WalletSelectListProps {
  wallets: WalletItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh?: () => void;
}

function LongPressWalletChip({
  wallet,
  index,
  isSelected,
  onSelect,
  onEdit,
  onKeyDown,
}: {
  wallet: WalletItem;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (wallet: WalletItem) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number, wallet: WalletItem) => void;
}): JSX.Element {
  const longPress = useLongPress({
    onLongPress: () => onEdit(wallet),
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Badge
          variant={isSelected ? 'default' : 'outline'}
          data-testid="wallet-chip"
          data-selected={isSelected ? 'true' : 'false'}
          data-wallet-index={index}
          role="option"
          aria-selected={isSelected}
          tabIndex={0}
          style={
            isSelected
              ? {
                  backgroundColor: wallet.color,
                  borderColor: wallet.color,
                }
              : { borderColor: wallet.color, color: wallet.color }
          }
          className={cn(
            'cursor-pointer whitespace-nowrap shrink-0 select-none',
            isSelected && 'text-white',
          )}
          onClick={() => onSelect(wallet.id)}
          onKeyDown={(e) => onKeyDown(e, index, wallet)}
          {...longPress}
        >
          {wallet.name}
        </Badge>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(wallet)}>
          Edit
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
function WalletEditDialog({
  open,
  onOpenChange,
  wallet,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: WalletItem;
  onSaved: () => void;
}): JSX.Element {
  const [name, setName] = useState(wallet.name);
  const [description, setDescription] = useState(wallet.description);
  const [color, setColor] = useState(wallet.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setError(null);
    setSaving(true);
    try {
      await updateWallet(wallet.id, {
        name: name.trim(),
        description: description.trim(),
        color,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-wallet-name">Name</Label>
            <Input
              id="edit-wallet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-wallet-desc">Description</Label>
            <Input
              id="edit-wallet-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-wallet-color">Color</Label>
            <input
              id="edit-wallet-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-md border border-input cursor-pointer"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-between gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteWallet(wallet.id);
                  onSaved();
                  onOpenChange(false);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to delete wallet');
                }
              }}
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
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WalletCreateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1f8a4c');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setError(null);
    setSaving(true);
    try {
      await createWallet({
        name: name.trim(),
        description: description.trim(),
        color,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-wallet-name">Name</Label>
            <Input
              id="create-wallet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-wallet-desc">Description</Label>
            <Input
              id="create-wallet-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-wallet-color">Color</Label>
            <input
              id="create-wallet-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-md border border-input cursor-pointer"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WalletViewAllDialog({
  open,
  onOpenChange,
  wallets,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletItem[];
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>All Wallets</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {wallets.map((wallet) => (
            <Badge
              key={wallet.id}
              variant="outline"
              style={{ borderColor: wallet.color, color: wallet.color }}
              className="cursor-pointer justify-center py-2"
              onClick={() => {
                onSelect(wallet.id);
                onOpenChange(false);
              }}
            >
              {wallet.name}
            </Badge>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WalletSelectList({
  wallets,
  selectedId,
  onSelect,
  onRefresh,
}: WalletSelectListProps): JSX.Element {
  const [editWallet, setEditWallet] = useState<WalletItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showViewAll, setShowViewAll] = useState(false);

  const handleSaved = (): void => {
    onRefresh?.();
  };

  if (wallets.length === 0) {
    return (
      <div
        className="text-sm text-muted-foreground py-2"
        data-testid="wallet-select-list"
      >
        No wallets yet
      </div>
    );
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    wallet: WalletItem,
  ): void => {
    const options = wallets.length;
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % options;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + options) % options;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey) {
        setEditWallet(wallet);
      } else {
        onSelect(wallet.id);
      }
      return;
    }

    if (nextIndex !== null) {
      const nextEl = document.querySelector(
        `[data-wallet-index="${nextIndex}"]`,
      ) as HTMLElement | null;
      nextEl?.focus();
    }
  };

  return (
    <>
      <ScrollArea className="w-full" role="listbox">
        <div
          className="flex items-center gap-2 px-0.5 py-1"
          data-testid="wallet-select-list"
        >
          {wallets.map((wallet, index) => {
            const isSelected = wallet.id === selectedId;
            return (
              <LongPressWalletChip
                key={wallet.id}
                wallet={wallet}
                index={index}
                isSelected={isSelected}
                onSelect={onSelect}
                onEdit={setEditWallet}
                onKeyDown={handleKeyDown}
              />
            );
          })}
          {onRefresh && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={() => setShowCreate(true)}
                aria-label="Add wallet"
              >
                <Plus size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={() => setShowViewAll(true)}
                aria-label="View all wallets"
              >
                <Grid3X3 size={16} />
              </Button>
            </>
          )}
        </div>
      </ScrollArea>

      {editWallet && (
        <WalletEditDialog
          open={!!editWallet}
          onOpenChange={(open) => {
            if (!open) setEditWallet(null);
          }}
          wallet={editWallet}
          onSaved={handleSaved}
        />
      )}

      <WalletCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleSaved}
      />

      <WalletViewAllDialog
        open={showViewAll}
        onOpenChange={setShowViewAll}
        wallets={wallets}
        onSelect={onSelect}
      />
    </>
  );
}
