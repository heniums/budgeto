import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/memphis/card';

interface WidgetCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function WidgetCard({
  title,
  icon: Icon,
  children,
  className,
}: WidgetCardProps): JSX.Element {
  return (
    <Card className={`memphis-card-press h-full flex flex-col ${className ?? ''}`}>
      <CardHeader className="flex flex-row items-center gap-0 space-y-0 p-6 pb-3">
        <div className="h-7 w-7 rounded-lg border-2 border-border bg-card flex items-center justify-center mr-3 flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-6 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
