export type DateInterval = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface WidgetFilterConfig {
  wallets?: string[];
  categories?: string[];
  interval?: DateInterval;
  startDate?: string;
  endDate?: string;
  limit?: number;
  budgetIds?: string[];
}
