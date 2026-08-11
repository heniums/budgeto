import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WidgetCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function WidgetCard({
  title,
  children,
  className,
}: WidgetCardProps): JSX.Element {
  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">{children}</CardContent>
    </Card>
  );
}
