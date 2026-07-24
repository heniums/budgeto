import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CURRENCIES, filterCurrencies, type CurrencyCode } from '@/lib/currencies';

export interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  id,
  name,
  className,
  disabled,
}: CurrencyInputProps): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selectedName = React.useMemo(() => {
    const found = CURRENCIES.find((c) => c.code === value);
    return found ? `${found.code} — ${found.name}` : undefined;
  }, [value]);

  const results = React.useMemo(() => filterCurrencies(query), [query]);

  const handleSelect = (code: CurrencyCode) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          name={name}
          type="button"
          disabled={disabled}
          aria-label="Currency"
          onBlur={onBlur}
          className={cn(
            'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !selectedName && 'text-muted-foreground',
            className,
          )}
        >
          {selectedName ?? 'Select currency'}
        </button>
      </PopoverPrimitive.Trigger>
      {/* Render inline (no Portal) so the content stays inside the parent
          Dialog's DOM and focus scope when used inside a Dialog. */}
      <PopoverPrimitive.Content
        align="start"
        sideOffset={4}
        className="w-72 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center border-b px-3 py-2">
          <Input
            placeholder="Search currency…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <ScrollArea className="h-64">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No currencies found.
            </p>
          ) : (
            <div className="p-1">
              {results.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    c.code === value && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => handleSelect(c.code)}
                >
                  <span className="font-medium">{c.code}</span>
                  <span className="text-muted-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
