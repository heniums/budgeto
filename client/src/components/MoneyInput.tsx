import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/currencies';
import { cn } from '@/lib/utils';

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  onChange: (value: string) => void;
  value?: string;
  currency?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, currency = 'USD', value, onChange, onBlur, placeholder, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const displayValue = React.useMemo(() => {
      if (isFocused) return value;
      const n = Number(value);
      if (!Number.isFinite(n) || value === '' || value === undefined)
        return value;
      return formatMoney(value, currency ?? 'USD');
    }, [value, isFocused, currency]);

    return (
      <div className={cn('relative', className)}>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          placeholder={placeholder ?? '0.00'}
          {...props}
        />
      </div>
    );
  },
);

MoneyInput.displayName = 'MoneyInput';
