import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getIcon } from '../lib/icons';

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface CategorySelectListProps {
  categories: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategorySelectList({
  categories,
  selectedId,
  onSelect,
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
      onSelect(categories[index].id);
      return;
    }

    if (nextIndex !== null) {
      const nextEl = document.querySelector(
        `[data-category-index="${nextIndex}"]`,
      ) as HTMLElement | null;
      nextEl?.focus();
    }
  };

  return (
    <ScrollArea className="w-full" role="listbox">
      <div
        className="flex gap-2 px-0.5 py-1"
        data-testid="category-select-list"
      >
        {categories.map((category, index) => {
          const isSelected = category.id === selectedId;
          const Icon = getIcon(category.icon);

          return (
            <button
              key={category.id}
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
                'flex items-center justify-center w-9 h-9 rounded-full border-2 border-transparent cursor-pointer shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'border-current bg-current/15'
                  : 'hover:bg-muted',
              )}
              onClick={() => onSelect(category.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {Icon && <Icon size={18} />}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
