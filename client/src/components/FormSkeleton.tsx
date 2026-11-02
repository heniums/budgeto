import { Skeleton } from '@/components/ui/skeleton';

interface FormSkeletonProps {
  rows?: number;
}

export function FormSkeleton({ rows = 4 }: FormSkeletonProps): JSX.Element {
  return (
    <div className="mt-6 space-y-4" data-testid="form-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
