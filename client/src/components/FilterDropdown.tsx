import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/memphis/button';
import { cn } from '@/lib/utils';

export interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  open: openProp,
  onOpenChange,
}: FilterDropdownProps): JSX.Element {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const containerRef = useRef<HTMLDivElement>(null);

  function updateOpen(next: boolean): void {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        updateOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') updateOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => updateOpen(!open)}
      >
        {label}: {current?.label ?? ''}
      </Button>
      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className="absolute z-20 mt-1 min-w-[10rem] rounded-md border-2 border-border bg-card p-1 memphis-card"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              aria-current={option.value === value}
              onClick={() => {
                onChange(option.value);
                updateOpen(false);
              }}
              className={cn(
                'block w-full rounded-sm px-3 py-1.5 text-left text-sm hover:bg-muted',
                option.value === value
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
