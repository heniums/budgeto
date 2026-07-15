import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

export function WalletSelectList({
  wallets,
  selectedId,
  onSelect,
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
      onSelect(wallets[index].id);
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
    <ScrollArea className="w-full" role="listbox">
      <div className="flex gap-2 px-0.5 py-1" data-testid="wallet-select-list">
        {wallets.map((wallet, index) => {
          const isSelected = wallet.id === selectedId;
          return (
            <Badge
              key={wallet.id}
              variant={isSelected ? 'default' : 'outline'}
              data-testid="wallet-chip"
              data-selected={isSelected ? 'true' : 'false'}
              data-wallet-index={index}
              role="option"
              aria-selected={isSelected}
              tabIndex={0}
              style={
                isSelected
                  ? { backgroundColor: wallet.color, borderColor: wallet.color }
                  : { borderColor: wallet.color, color: wallet.color }
              }
              className={cn(
                'cursor-pointer whitespace-nowrap shrink-0',
                isSelected && 'text-white',
              )}
              onClick={() => onSelect(wallet.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {wallet.name}
            </Badge>
          );
        })}
      </div>
    </ScrollArea>
  );
}
