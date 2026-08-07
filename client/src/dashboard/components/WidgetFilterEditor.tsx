import { useDashboardData } from '../DashboardDataProvider';
import { MultiItemPicker } from '@/components/MultiItemPicker';
import { DateRangeButton } from '@/components/DateRangeButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WIDGET_FILTER_FIELDS, type FilterField } from '../widgetFilters';
import type { DateInterval, WidgetFilterConfig, WidgetType } from '../types';
import type { DatePreset } from '@/lib/dateRange';

interface WidgetFilterEditorProps {
  widgetId: WidgetType;
  config: WidgetFilterConfig;
  onChange: (config: WidgetFilterConfig) => void;
  onIntervalMenuOpenChange?: (open: boolean) => void;
}

export function WidgetFilterEditor({
  widgetId,
  config,
  onChange,
  onIntervalMenuOpenChange,
}: WidgetFilterEditorProps): JSX.Element {
  const { summary, categories } = useDashboardData();
  const fields = WIDGET_FILTER_FIELDS[widgetId];

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This widget has no configurable filters.
      </p>
    );
  }

  function update(partial: Partial<WidgetFilterConfig>): void {
    onChange({ ...config, ...partial });
  }

  const wallets = summary?.wallets ?? [];
  const budgets = summary?.budgets ?? [];

  function renderField(field: FilterField): JSX.Element | null {
    switch (field) {
      case 'wallets':
        return (
          <MultiItemPicker
            key="wallets"
            label="Wallets"
            placeholder="All wallets"
            emptyMessage="No wallets available"
            items={wallets.map((w) => ({
              id: w.id,
              name: w.name,
              color: w.color,
            }))}
            selectedIds={config.wallets ?? []}
            onChange={(ids) => update({ wallets: ids })}
          />
        );
      case 'categories':
        return (
          <MultiItemPicker
            key="categories"
            label="Categories"
            placeholder="All categories"
            emptyMessage="No categories available"
            items={categories.map((c) => ({
              id: c.id,
              name: c.name,
              color: c.color,
              icon: c.icon,
            }))}
            selectedIds={config.categories ?? []}
            onChange={(ids) => update({ categories: ids })}
          />
        );
      case 'budgetIds':
        return (
          <MultiItemPicker
            key="budgetIds"
            label="Budgets"
            placeholder="All budgets"
            emptyMessage="No budgets available"
            items={budgets.map((b) => ({
              id: b.id,
              name: b.name,
              color: b.color,
              icon: b.icon,
            }))}
            selectedIds={config.budgetIds ?? []}
            onChange={(ids) => update({ budgetIds: ids })}
          />
        );
      case 'interval':
        return (
          <div key="interval" className="space-y-2">
            <Label>Interval</Label>
            <DateRangeButton
              value={(config.interval ?? 'month') as DatePreset}
              onChange={(preset) => update({ interval: preset as DateInterval })}
              onOpenChange={onIntervalMenuOpenChange}
            />
          </div>
        );
      case 'customRange':
        if (config.interval !== 'custom') return null;
        return (
          <div key="customRange" className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate ?? ''}
                onChange={(e) => update({ startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate ?? ''}
                min={config.startDate ?? ''}
                onChange={(e) => update({ endDate: e.target.value })}
              />
            </div>
          </div>
        );
      case 'limit':
        return (
          <div key="limit" className="space-y-2">
            <Label htmlFor="limit">Number of items</Label>
            <Input
              id="limit"
              type="number"
              min={1}
              max={100}
              value={config.limit ?? 5}
              onChange={(e) =>
                update({
                  limit: Math.min(
                    100,
                    Math.max(1, Math.trunc(Number(e.target.value)) || 5),
                  ),
                })
              }
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => renderField(field))}
    </div>
  );
}
