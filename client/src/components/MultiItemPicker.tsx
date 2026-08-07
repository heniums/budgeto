import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getIcon } from '@/lib/icons';
import { X } from 'lucide-react';

interface PickerItem {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

interface MultiItemPickerProps {
  items: PickerItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
  placeholder?: string;
  emptyMessage?: string;
}

export function MultiItemPicker({
  items,
  selectedIds,
  onChange,
  label,
  placeholder = 'Select items...',
  emptyMessage = 'No items available',
}: MultiItemPickerProps): JSX.Element {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const selectedSet = new Set(selectedIds);

  function toggle(id: string): void {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function remove(id: string): void {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  const selectedItems = items.filter((item) => selectedSet.has(item.id));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <Badge key={item.id} variant="secondary" className="gap-1">
              {item.color && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {item.name}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            {selectedIds.length === 0
              ? placeholder
              : `${selectedIds.length} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[250px] p-0 pointer-events-auto"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="h-[200px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              filtered.map((item) => {
                const ItemIcon = item.icon ? getIcon(item.icon) : undefined;
                return (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedSet.has(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                    />
                    {item.color && (
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {ItemIcon && <ItemIcon className="h-4 w-4 text-muted-foreground" />}
                    <span>{item.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
