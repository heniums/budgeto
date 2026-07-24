import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ColorSwatch } from '@/components/ColorSwatch';
import { PRESET_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export function ColorInput({
  value,
  onChange,
  onBlur,
  id,
  name,
  className,
  disabled,
}: ColorInputProps): JSX.Element {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          name={name}
          type="button"
          disabled={disabled}
          aria-label="Color"
          onBlur={onBlur}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <ColorSwatch color={value} size="sm" />
          <span className="font-mono text-xs">{value}</span>
        </button>
      </PopoverPrimitive.Trigger>
      {/* Render inline (no Portal) so the content stays inside the parent
          Dialog's DOM and focus scope when used inside a Dialog. */}
      <PopoverPrimitive.Content
        align="center"
        sideOffset={4}
        className="w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              className={cn(
                'h-8 w-full rounded border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={id ? `${id}-custom` : undefined} className="text-xs text-muted-foreground">
            Custom
          </label>
          <input
            id={id ? `${id}-custom` : undefined}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-8 cursor-pointer rounded border border-input bg-transparent p-0"
          />
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
