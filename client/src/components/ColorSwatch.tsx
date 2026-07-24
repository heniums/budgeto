import { cn } from '@/lib/utils';

export interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap: Record<NonNullable<ColorSwatchProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function ColorSwatch({
  color,
  size = 'md',
  className,
}: ColorSwatchProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-sm border border-border',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}
