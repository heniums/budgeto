import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full glass',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 bg-primary transition-all',
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
