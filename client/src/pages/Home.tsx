import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, GripVertical } from 'lucide-react';
import {
  DashboardDataProvider,
  useDashboardData,
} from '@/dashboard/DashboardDataProvider';
import { WIDGET_REGISTRY } from '@/dashboard/registry';
import { WidgetSettingsDialog } from '@/dashboard/WidgetSettingsDialog';
import { WidgetCard } from '@/dashboard/components/WidgetCard';
import { WidgetMenu } from '@/dashboard/components/WidgetMenu';
import { Skeleton } from '@/components/ui/skeleton';
import { useGridColumns } from '@/dashboard/hooks/useGridColumns';
import type { WidgetType, WidgetConfig } from '@/dashboard/types';

export function Home(): JSX.Element {
  return (
    <DashboardDataProvider>
      <HomeContent />
    </DashboardDataProvider>
  );
}

function HomeContent(): JSX.Element {
  const { widgets, loading, saveWidgets } = useDashboardData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<{
    id: string;
    type: WidgetType;
    title: string;
    width: number;
    height: number;
  } | null>(null);
  const cols = useGridColumns();

  const visible = useMemo(
    () => widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order),
    [widgets],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const w = widgets.find((x) => x.id === id);
    const rect = event.active.rect?.current?.initial;
    if (w && rect) {
      setActiveWidget({
        id,
        type: w.id,
        title: WIDGET_REGISTRY[w.id]?.title ?? w.id,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setActiveWidget(
        id && w
          ? {
              id,
              type: w.id,
              title: WIDGET_REGISTRY[w.id]?.title ?? w.id,
              width: 0,
              height: 0,
            }
          : null,
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveWidget(null);
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((w) => w.id === active.id);
    const newIndex = visible.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex);
    const hidden = widgets.filter((w) => !w.visible);
    const ordered = reordered.map((w, i) => ({ ...w, order: i }));
    const hiddenReindexed = hidden.map((w, i) => ({
      ...w,
      order: reordered.length + i,
    }));
    saveWidgets([...ordered, ...hiddenReindexed]);
  }

  function handleDragCancel() {
    setActiveWidget(null);
  }

  return (
    <main className="home-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Home</h1>
          <Badge variant="secondary">Work in Progress</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" /> Customize
        </Button>
      </div>
      {loading ? (
        <div
          className="mt-6 grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows: 'minmax(12rem, auto)',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-full w-full" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={visible.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className="mt-6 grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridAutoRows: 'minmax(12rem, auto)',
                gridAutoFlow: 'dense',
              }}
            >
              {visible.map((widget) => (
                <SortableWidgetItem
                  key={widget.id}
                  widget={widget}
                  widgets={widgets}
                  cols={cols}
                  saveWidgets={saveWidgets}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeWidget ? (
              <div
                className="opacity-80 cursor-grabbing"
                style={{
                  width: activeWidget.width || undefined,
                  height: activeWidget.height || undefined,
                }}
              >
                <WidgetCard title={activeWidget.title}>
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm" />
                </WidgetCard>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <WidgetSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </main>
  );
}

function SortableWidgetItem({
  widget,
  widgets,
  cols,
  saveWidgets,
}: {
  widget: WidgetConfig;
  widgets: WidgetConfig[];
  cols: number;
  saveWidgets: (widgets: WidgetConfig[]) => Promise<void>;
}): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${Math.min(widget.colSpan, cols)}`,
    gridRow: `span ${widget.rowSpan}`,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };
  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <WidgetRenderer type={widget.id} />
      <WidgetMenu widget={widget} widgets={widgets} saveWidgets={saveWidgets} />
    </div>
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
