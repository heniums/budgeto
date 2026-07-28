import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { useDashboardData } from './DashboardDataProvider';
import { WIDGET_REGISTRY } from './registry';
import { DEFAULT_WIDGETS } from './defaults';
import type { WidgetConfig } from './types';

interface WidgetSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetSettingsDialog({
  open,
  onOpenChange,
}: WidgetSettingsDialogProps): JSX.Element {
  const { widgets, saveWidgets } = useDashboardData();
  const [local, setLocal] = useState<WidgetConfig[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync local state when dialog opens
  if (open && !initialized) {
    setLocal(widgets.map((w) => ({ ...w })));
    setInitialized(true);
  }
  if (!open && initialized) {
    setInitialized(false);
  }

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setLocal((prev) => {
        const next = [...prev];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return next.map((w, i) => ({ ...w, order: i }));
      });
    },
    [],
  );

  const moveDown = useCallback(
    (index: number) => {
      setLocal((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return next.map((w, i) => ({ ...w, order: i }));
      });
    },
    [],
  );

  const toggleVisibility = useCallback((id: string) => {
    setLocal((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w,
      ),
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setLocal(
      DEFAULT_WIDGETS.map((w, i) => ({ ...w, order: i })),
    );
  }, []);

  const handleSave = useCallback(async () => {
    await saveWidgets(local);
    onOpenChange(false);
  }, [local, saveWidgets, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {local.map((widget, index) => {
            const meta = WIDGET_REGISTRY[widget.id];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div
                key={widget.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  checked={widget.visible}
                  onCheckedChange={() => toggleVisibility(widget.id)}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">{meta.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveUp(index)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === local.length - 1}
                  onClick={() => moveDown(index)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
