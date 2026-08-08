import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DATE_PRESETS, type DatePreset } from '@/lib/dateRange';

interface DateRangeButtonProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DateRangeButton({
  value,
  onChange,
  open: openProp,
  onOpenChange,
}: DateRangeButtonProps): JSX.Element {
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

  const current = DATE_PRESETS.find((preset) => preset.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => updateOpen(!open)}
      >
        Date: {current?.label ?? 'Day'}
      </Button>
      {open && (
        <div
          role="menu"
          aria-label="Date range"
          className="absolute z-20 mt-1 min-w-[10rem] rounded-md border border-input bg-background p-1 shadow-md"
        >
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              role="menuitem"
              aria-current={preset.value === value}
              onClick={() => {
                onChange(preset.value);
                updateOpen(false);
              }}
              className={cn(
                'block w-full rounded-sm px-3 py-1.5 text-left text-sm hover:bg-muted',
                preset.value === value
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
