import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { getIcon } from '../lib/icons';
import { useLongPress } from '../hooks/use-long-press';
import { Plus, Grid3X3, MoreHorizontal } from 'lucide-react';
import { FuzzyItemPicker } from './FuzzyItemPicker';

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
        'flex items-center gap-1.5 h-9 px-3 rounded-full border-2 border-transparent cursor-pointer shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none',
        isSelected ? 'border-current bg-current/15' : 'hover:bg-muted',
      )}
      onClick={() => onSelect(category.id)}
      onKeyDown={(e) => onKeyDown(e, index, category)}
      {...longPress}
    >
      {Icon && <Icon size={18} className="shrink-0" />}
      <span className="text-sm font-medium leading-none whitespace-nowrap">
        {category.name}
      </span>
    </button>
  );

  if (!onEdit) return chip;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{chip}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(category)}>Edit</ContextMenuItem>
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const nextEl = containerRef.current?.querySelector(
        `[data-category-index="${nextIndex}"]`,
      ) as HTMLElement | null;
      nextEl?.focus();
    }
  };

  const hasActions = onRefresh || onCreate || onViewAll;

  return (
    <div className="relative w-full min-w-0" data-testid="category-select-list">
      <div
        ref={containerRef}
        className="flex scrollbar-hide min-w-0 items-center gap-2 overflow-x-auto pr-2 py-1"
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More categories"
              className="sticky left-0 z-10 shrink-0 h-7 w-7"
            >
              <MoreHorizontal size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverPrimitive.Content
            align="start"
            className="z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
            sideOffset={4}
          >
            <FuzzyItemPicker
              key={open ? 'open' : 'closed'}
              items={categories}
              selectedId={selectedId}
              onSelect={(id) => {
                onSelect(id);
                setOpen(false);
              }}
              getId={(c) => c.id}
              getLabel={(c) => c.name}
              renderItem={(category) => {
                const Icon = getIcon(category.icon);
                return (
                  <div
                    className="flex min-w-0 items-center gap-2"
                    style={{ color: category.color }}
                  >
                    {Icon && <Icon size={18} className="shrink-0" />}
                    <span className="truncate">{category.name}</span>
                  </div>
                );
              }}
              title="All categories"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories match your search"
            />
          </PopoverPrimitive.Content>
        </Popover>
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
                type="button"
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
                type="button"
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
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
        aria-hidden
      />
    </div>
  );
}
