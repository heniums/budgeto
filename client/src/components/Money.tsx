import { formatMoney } from '../lib/currencies';
import { cn } from '@/lib/utils';

export interface MoneyProps {
  amount: string;
  currency: string;
  className?: string;
}

export function Money({ amount, currency, className }: MoneyProps): JSX.Element {
  const n = Number(amount);
  const negative = Number.isFinite(n) && n < 0;
  return (
    <span
      className={cn(
        negative ? 'text-destructive' : 'text-foreground',
        className,
      )}
    >
      {formatMoney(amount, currency)}
    </span>
  );
}
