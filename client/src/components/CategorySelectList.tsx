import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { getIcon } from '../lib/icons';
import { useLongPress } from '../hooks/use-long-press';
import { Plus, Grid3X3 } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface CategorySelectListProps {
  categories: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh?: () => void;
  onCreate?: () => void;
  onEdit?: (category: CategoryItem) => void;
  onViewAll?: () => void;
}

function LongPressCategoryChip({
  category,
  index,
  isSelected,
  onSelect,
  onEdit,
  onKeyDown,
}: {
  category: CategoryItem;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (category: CategoryItem) => void;
  onKeyDown: (
    e: React.KeyboardEvent,
    index: number,
    category: CategoryItem,
  ) => void;
}): JSX.Element {
  const Icon = getIcon(category.icon);
  const longPress = useLongPress({
    onLongPress: () => onEdit?.(category),
  });

  const chip = (
    <button
      type="button"
      data-testid="category-chip"
      data-selected={isSelected ? 'true' : 'false'}
      data-category-index={index}
      role="option"
      aria-selected={isSelected}
      aria-label={category.name}
      title={category.name}
      tabIndex={0}
      style={{ color: category.color }}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-full border-2 border-transparent cursor-pointer shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none',
        isSelected ? 'border-current bg-current/15' : 'hover:bg-muted',
      )}
      onClick={() => onSelect(category.id)}
      onKeyDown={(e) => onKeyDown(e, index, category)}
      {...longPress}
    >
      {Icon && <Icon size={18} />}
    </button>
  );

  if (!onEdit) return chip;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{chip}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(category)}>
          Edit
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function CategorySelectList({
  categories,
  selectedId,
  onSelect,
  onRefresh,
  onCreate,
  onEdit,
  onViewAll,
}: CategorySelectListProps): JSX.Element {
  if (categories.length === 0) {
    return (
      <div
        className="text-sm text-muted-foreground py-2"
        data-testid="category-select-list"
      >
        No categories yet
      </div>
    );
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    category: CategoryItem,
  ): void => {
    const options = categories.length;
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
        if (onEdit) onEdit(category);
      } else {
        onSelect(category.id);
      }
      return;
    }

    if (nextIndex !== null) {
      const nextEl = document.querySelector(
        `[data-category-index="${nextIndex}"]`,
      ) as HTMLElement | null;
      nextEl?.focus();
    }
  };

  const hasActions = onRefresh || onCreate || onViewAll;

  return (
    <ScrollArea className="w-full" role="listbox">
      <div
        className="flex items-center gap-2 px-0.5 py-1"
        data-testid="category-select-list"
      >
        {categories.map((category, index) => {
          const isSelected = category.id === selectedId;
          return (
            <LongPressCategoryChip
              key={category.id}
              category={category}
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
                aria-label="Add category"
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
                aria-label="View all categories"
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
