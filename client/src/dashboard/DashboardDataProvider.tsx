import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getWidgets,
  saveWidgets as saveWidgetsApi,
  type DashboardSummary,
  type WidgetConfigInput,
} from '@/api/dashboard';
import type { CategoryData } from '@/api/categories';
import type { ApiError } from '@/api/client';
import {
  CATEGORIES_KEY,
  DASHBOARD_KEY,
  DASHBOARD_SUMMARY_KEY,
  DASHBOARD_WIDGETS_KEY,
} from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCategoriesQuery } from '@/hooks/use-categories';
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
  const queryClient = useQueryClient();
  const summaryQuery = useQuery<DashboardSummary, ApiError>({
    queryKey: DASHBOARD_SUMMARY_KEY,
    queryFn: getDashboardSummary,
  });
  const widgetsQuery = useQuery<WidgetConfigInput[], ApiError>({
    queryKey: DASHBOARD_WIDGETS_KEY,
    queryFn: getWidgets,
  });
  // Categories stay non-fatal for the dashboard: a failure degrades to an
  // empty list (widget defaults), never the provider error.
  const categoriesQuery = useCategoriesQuery();

  const widgets = useMemo(
    () =>
      widgetsQuery.data
        ? mergeWithDefaults(widgetsQuery.data)
        : DEFAULT_WIDGETS.map((w, i) => ({ ...w, order: i })),
    [widgetsQuery.data],
  );

  const loading =
    summaryQuery.isPending ||
    widgetsQuery.isPending ||
    categoriesQuery.isPending;
  const error = summaryQuery.error ?? widgetsQuery.error ?? null;

  const refresh = useCallback((): void => {
    // ['dashboard'] prefix covers summary, widgets, and widget-data keys so
    // network-backed widgets refetch alongside the summary they depend on.
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
  }, []);

  const saveWidgets = useCallback(async (newWidgets: WidgetConfig[]) => {
    const input: WidgetConfigInput[] = newWidgets.map((w) => ({
      widgetId: w.id,
      visible: w.visible,
      order: w.order,
      colSpan: w.colSpan,
      rowSpan: w.rowSpan,
      config: normalizeFilterConfig(w.config),
    }));
    await saveWidgetsApi(input);
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_WIDGETS_KEY });
  }, []);

  const value = useMemo<DashboardData>(
    () => ({
      summary: summaryQuery.data ?? null,
      widgets,
      categories: categoriesQuery.data ?? [],
      loading,
      error,
      refresh,
      saveWidgets,
    }),
    [summaryQuery.data, widgets, categoriesQuery.data, loading, error, refresh, saveWidgets],
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
