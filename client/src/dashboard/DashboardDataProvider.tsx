import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getDashboardSummary,
  getWidgets,
  saveWidgets as saveWidgetsApi,
  type DashboardSummary,
  type WidgetConfigInput,
} from '@/api/dashboard';
import { getCategories, type CategoryData } from '@/api/categories';
import type { ApiError } from '@/api/client';
import type { WidgetConfig } from './types';
import { DEFAULT_WIDGETS } from './defaults';
import {
  DEFAULT_WIDGET_FILTERS,
  normalizeFilterConfig,
} from './widgetFilters';

interface DashboardData {
  summary: DashboardSummary | null;
  widgets: WidgetConfig[];
  categories: CategoryData[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => void;
  saveWidgets: (widgets: WidgetConfig[]) => Promise<void>;
}

const DashboardContext = createContext<DashboardData | null>(null);

function mergeWithDefaults(serverWidgets: WidgetConfigInput[]): WidgetConfig[] {
  const byId = new Map(
    serverWidgets.map((w) => {
      const defaultW = DEFAULT_WIDGETS.find((d) => d.id === w.widgetId);
      const defaultConfig = DEFAULT_WIDGET_FILTERS[w.widgetId as WidgetConfig['id']] ?? {};
      return [
        w.widgetId,
        {
          id: w.widgetId as WidgetConfig['id'],
          visible: w.visible,
          order: w.order,
          colSpan: w.colSpan ?? defaultW?.colSpan ?? 1,
          rowSpan: w.rowSpan ?? defaultW?.rowSpan ?? 1,
          config: { ...defaultConfig, ...(w.config ?? {}) },
        },
      ];
    }),
  );
  const merged = DEFAULT_WIDGETS.map(
    (defaultW) =>
      byId.get(defaultW.id) ?? {
        id: defaultW.id,
        visible: defaultW.visible,
        order: defaultW.order,
        colSpan: defaultW.colSpan,
        rowSpan: defaultW.rowSpan,
        config: defaultW.config,
      },
  );
  const extra = serverWidgets
    .filter((w) => !DEFAULT_WIDGETS.some((d) => d.id === w.widgetId))
    .map((w) => ({
      id: w.widgetId as WidgetConfig['id'],
      visible: w.visible,
      order: w.order,
      colSpan: w.colSpan ?? 1,
      rowSpan: w.rowSpan ?? 1,
      config: w.config ?? {},
    }));
  return [...merged, ...extra].sort((a, b) => a.order - b.order);
}

export function DashboardDataProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(
    DEFAULT_WIDGETS.map((w, i) => ({ ...w, order: i })),
  );
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, serverWidgets] = await Promise.all([
        getDashboardSummary(),
        getWidgets(),
      ]);
      setSummary(summaryData);
      setWidgets(mergeWithDefaults(serverWidgets));
      try {
        const { categories } = await getCategories();
        setCategories(categories);
      } catch {
        setCategories([]);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const saveWidgets = useCallback(async (newWidgets: WidgetConfig[]) => {
    const input: WidgetConfigInput[] = newWidgets.map((w) => ({
      widgetId: w.id,
      visible: w.visible,
      order: w.order,
      colSpan: w.colSpan,
      rowSpan: w.rowSpan,
      config: normalizeFilterConfig(w.config),
    }));
    const saved = await saveWidgetsApi(input);
    setWidgets(mergeWithDefaults(saved));
  }, []);

  const value = useMemo<DashboardData>(
    () => ({ summary, widgets, categories, loading, error, refresh: fetch, saveWidgets }),
    [summary, widgets, categories, loading, error, fetch, saveWidgets],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error(
      'useDashboardData must be used within DashboardDataProvider',
    );
  }
  return ctx;
}
