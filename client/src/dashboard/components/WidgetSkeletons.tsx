import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function StatSkeleton({
  valueClassName,
}: {
  valueClassName?: string;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className={cn('h-8 w-28', valueClassName)} />
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function ProgressListSkeleton({
  rows = 3,
}: {
  rows?: number;
}): JSX.Element {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton(): JSX.Element {
  return <Skeleton className="h-full w-full" />;
}
