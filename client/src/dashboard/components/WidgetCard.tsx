import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface WidgetCardProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: Error | null;
  className?: string;
}

export function WidgetCard({
  title,
  children,
  loading,
  error,
  className,
}: WidgetCardProps): JSX.Element {
  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
