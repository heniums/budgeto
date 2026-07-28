import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { WidgetConfigDialog } from './WidgetConfigDialog';
import type { WidgetConfig } from '../types';

interface WidgetMenuProps {
  widget: WidgetConfig;
  widgets: WidgetConfig[];
  saveWidgets: (widgets: WidgetConfig[]) => Promise<void>;
}

export function WidgetMenu({ widget, widgets, saveWidgets }: WidgetMenuProps): JSX.Element {
  const [configOpen, setConfigOpen] = useState(false);

  async function handleHide() {
    const updated = widgets.map((w) =>
      w.id === widget.id ? { ...w, visible: false } : w,
    );
    await saveWidgets(updated);
  }

  return (
    <>
      <div
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => setConfigOpen(true)}
            >
              Configure
            </button>
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={handleHide}
            >
              Hide
            </button>
          </PopoverContent>
        </Popover>
      </div>
      <WidgetConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        widget={widget}
        widgets={widgets}
        saveWidgets={saveWidgets}
      />
    </>
  );
}
