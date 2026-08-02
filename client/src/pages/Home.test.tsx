import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';
import type { WidgetConfig } from '@/dashboard/types';

const sampleWidgets: WidgetConfig[] = [
  { id: 'net-worth', visible: true, order: 0, colSpan: 1, rowSpan: 1 },
  { id: 'monthly-cash-flow', visible: false, order: 1, colSpan: 1, rowSpan: 2 },
  { id: 'income-vs-expense', visible: true, order: 2, colSpan: 1, rowSpan: 2 },
  {
    id: 'recent-transactions',
    visible: false,
    order: 3,
    colSpan: 1,
    rowSpan: 2,
  },
];

vi.mock('@/dashboard/DashboardDataProvider', () => ({
  DashboardDataProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useDashboardData: () => ({
    summary: null,
    widgets: sampleWidgets,
    loading: false,
    error: null,
    refresh: vi.fn(),
    saveWidgets: vi.fn(),
  }),
}));

vi.mock('@/dashboard/WidgetSettingsDialog', () => ({
  WidgetSettingsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="settings-dialog">Settings Dialog</div> : null,
}));

vi.mock('@/dashboard/registry', () => ({
  WIDGET_REGISTRY: {
    'net-worth': {
      id: 'net-worth',
      title: 'Net Worth',
      component: () => <div data-testid="widget-net-worth">NetWorth</div>,
    },
    'monthly-cash-flow': {
      id: 'monthly-cash-flow',
      title: 'Cash Flow',
      component: () => <div data-testid="widget-cash-flow">CashFlow</div>,
    },
    'income-vs-expense': {
      id: 'income-vs-expense',
      title: 'Income vs Expense',
      component: () => (
        <div data-testid="widget-income-expense">IncomeVsExpense</div>
      ),
    },
    'recent-transactions': {
      id: 'recent-transactions',
      title: 'Recent Transactions',
      component: () => <div data-testid="widget-recent-tx">RecentTx</div>,
    },
  },
}));

describe('Home page', () => {
  it('renders the Home heading and Customize button', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /customize/i }),
    ).toBeInTheDocument();
  });

  it('renders only visible widgets', () => {
    render(<Home />);
    expect(screen.getByTestId('widget-net-worth')).toBeInTheDocument();
    expect(screen.getByTestId('widget-income-expense')).toBeInTheDocument();
    expect(screen.queryByTestId('widget-cash-flow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('widget-recent-tx')).not.toBeInTheDocument();
  });

  it('opens the settings dialog when Customize is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /customize/i }));
    expect(screen.getByTestId('settings-dialog')).toBeInTheDocument();
  });
});
