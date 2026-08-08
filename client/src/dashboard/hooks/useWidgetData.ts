import { useEffect, useMemo, useState } from 'react';
import { useDashboardData } from '../DashboardDataProvider';
import { getWidgetData } from '@/api/dashboard';
import { defaultDataForWidget, type WidgetDataMap } from '../widgetData';
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

  const [data, setData] = useState<WidgetDataMap[T] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!summary) {
      setData(null);
      if (providerError) {
        setError(providerError);
        setLoading(false);
      } else {
        setLoading(true);
      }
      return;
    }

    const defaultData = defaultDataForWidget(id, summary, config);
    if (defaultData !== null) {
      setData(defaultData);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getWidgetData(id, config)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, summary, configKey, providerError]);

  return { config, data, loading, error };
}
