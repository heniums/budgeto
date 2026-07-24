import * as React from 'react';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/currencies';
import { cn } from '@/lib/utils';

export interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  currency?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      currency,
      placeholder,
      id,
      name,
      className,
      disabled,
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const displayValue = React.useMemo(() => {
      if (isFocused) return value;
      const n = Number(value);
      if (!Number.isFinite(n) || value === '') return value;
      return formatMoney(value, currency ?? 'USD');
    }, [value, isFocused, currency]);

    return (
      <div className={cn('relative', className)}>
        <Input
          ref={ref}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder ?? '0.00'}
          disabled={disabled}
        />
      </div>
    );
  },
);

MoneyInput.displayName = 'MoneyInput';
