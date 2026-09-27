import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardData } from '../DashboardDataProvider';
import { getWidgetData } from '@/api/dashboard';
import { defaultDataForWidget, type WidgetDataMap } from '../widgetData';
import { widgetDataKey } from '@/lib/queryKeys';
import type { WidgetFilterConfig, WidgetType } from '../types';

interface UseWidgetDataResult<T extends WidgetType> {
  config: WidgetFilterConfig;
  data: WidgetDataMap[T] | null;
  loading: boolean;
  error: Error | null;
}

export function useWidgetData<T extends WidgetType>(
  id: T,
): UseWidgetDataResult<T> {
  const { summary, widgets, error: providerError } = useDashboardData();
  const widget = widgets.find((w) => w.id === id);
  const config = widget?.config ?? {};
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  // Widgets whose data is fully derivable from the summary never hit the
  // network; the query stays disabled and the default short-circuits.
  const defaultData = summary ? defaultDataForWidget(id, summary, config) : null;

  const query = useQuery({
    queryKey: widgetDataKey(id, configKey),
    queryFn: () => getWidgetData(id, config),
    enabled: !!summary && defaultData === null,
  });

  return {
    config,
    data: defaultData ?? query.data ?? null,
    // Preserves the previous semantics: pending while the summary is absent
    // or a real fetch is in flight; not loading once the default covers it.
    loading: providerError ? false : defaultData === null ? query.isPending : false,
    error: providerError ?? query.error ?? null,
  };
}
