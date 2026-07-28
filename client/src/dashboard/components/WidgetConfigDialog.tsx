import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WIDGET_REGISTRY } from '../registry';
import type { WidgetConfig } from '../types';

interface WidgetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: WidgetConfig;
  widgets: WidgetConfig[];
  saveWidgets: (widgets: WidgetConfig[]) => Promise<void>;
}

export function WidgetConfigDialog({
  open,
  onOpenChange,
  widget,
  widgets,
  saveWidgets,
}: WidgetConfigDialogProps): JSX.Element {
  const [colSpan, setColSpan] = useState(widget.colSpan);
  const [rowSpan, setRowSpan] = useState(widget.rowSpan);

  useEffect(() => {
    if (open) {
      setColSpan(widget.colSpan);
      setRowSpan(widget.rowSpan);
    }
  }, [open, widget.colSpan, widget.rowSpan]);

  const meta = WIDGET_REGISTRY[widget.id];

  async function handleSave() {
    const updated = widgets.map((w) =>
      w.id === widget.id
        ? {
            ...w,
            colSpan: Math.min(2, Math.max(1, colSpan)),
            rowSpan: Math.min(4, Math.max(1, rowSpan)),
          }
        : w,
    );
    await saveWidgets(updated);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Configure Widget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Widget</label>
            <p className="text-sm text-muted-foreground">{meta?.title ?? widget.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="colSpan">
              Column span (1–2)
            </label>
            <Input
              id="colSpan"
              type="number"
              min={1}
              max={2}
              value={colSpan}
              onChange={(e) => setColSpan(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="rowSpan">
              Row span (1–4)
            </label>
            <Input
              id="rowSpan"
              type="number"
              min={1}
              max={4}
              value={rowSpan}
              onChange={(e) => setRowSpan(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
