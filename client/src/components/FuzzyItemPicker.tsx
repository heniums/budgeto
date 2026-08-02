import { useMemo, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fuzzyFilter } from '@/lib/fuzzyFilter';

export interface FuzzyItemPickerProps<T> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

export function FuzzyItemPicker<T>(props: FuzzyItemPickerProps<T>): JSX.Element {
  const { items, selectedId, onSelect, getId, getLabel, renderItem, title, searchPlaceholder, emptyMessage } = props;
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => fuzzyFilter(items, query, getLabel),
    [items, query, getLabel],
  );

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="pl-8"
        />
      </div>
      <ScrollArea className="h-72 w-full">
        <div className="space-y-1 pr-3" role="listbox" aria-label={title}>
          {filtered.length === 0 ? (
            <div className="py-2 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            filtered.map((item) => {
              const id = getId(item);
              const isSelected = id === selectedId;
              return (
                <div
                  key={id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                  )}
                  onClick={() => onSelect(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(id);
                    }
                  }}
                >
                  {renderItem(item, isSelected)}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
