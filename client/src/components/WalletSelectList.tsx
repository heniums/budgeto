import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useLongPress } from '../hooks/use-long-press';
import { Plus, Grid3X3 } from 'lucide-react';

export interface WalletItem {
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
  onCreate?: () => void;
  onEdit?: (wallet: WalletItem) => void;
  onViewAll?: () => void;
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
  onEdit?: (wallet: WalletItem) => void;
  onKeyDown: (
    e: React.KeyboardEvent,
    index: number,
    wallet: WalletItem,
  ) => void;
}): JSX.Element {
  const longPress = useLongPress({
    onLongPress: () => onEdit?.(wallet),
  });

  const chip = (
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
  );

  if (!onEdit) return chip;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{chip}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(wallet)}>
          Edit
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function WalletSelectList({
  wallets,
  selectedId,
  onSelect,
  onRefresh,
  onCreate,
  onEdit,
  onViewAll,
}: WalletSelectListProps): JSX.Element {
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
        if (onEdit) onEdit(wallet);
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

  const hasActions = onRefresh || onCreate || onViewAll;

  return (
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
              onEdit={onEdit}
              onKeyDown={handleKeyDown}
            />
          );
        })}
        {hasActions && (
          <>
            {onCreate && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={onCreate}
                aria-label="Add wallet"
              >
                <Plus size={16} />
              </Button>
            )}
            {onViewAll && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={onViewAll}
                aria-label="View all wallets"
              >
                <Grid3X3 size={16} />
              </Button>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
