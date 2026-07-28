import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { DashboardDataProvider, useDashboardData } from '@/dashboard/DashboardDataProvider';
import { WIDGET_REGISTRY } from '@/dashboard/registry';
import { WidgetSettingsDialog } from '@/dashboard/WidgetSettingsDialog';
import { WidgetCard } from '@/dashboard/components/WidgetCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { WidgetType } from '@/dashboard/types';

export function Home(): JSX.Element {
  return (
    <DashboardDataProvider>
      <HomeContent />
    </DashboardDataProvider>
  );
}

function WidgetRenderer({ type }: { type: WidgetType }): JSX.Element {
  const meta = WIDGET_REGISTRY[type];
  const Component = meta.component;
  return (
    <WidgetCard title={meta.title}>
      <Component />
    </WidgetCard>
  );
}

function HomeContent(): JSX.Element {
  const { widgets, loading } = useDashboardData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const visible = useMemo(
    () => widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order),
    [widgets],
  );

  return (
    <main className="home-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Home</h1>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-2" /> Customize
        </Button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {visible.map((widget) => (
            <WidgetRenderer key={widget.id} type={widget.id} />
          ))}
        </div>
      )}
      <WidgetSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </main>
  );
}
