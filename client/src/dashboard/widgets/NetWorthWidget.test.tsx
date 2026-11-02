import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Wallet } from 'lucide-react';
import { NetWorthWidget } from './NetWorthWidget';
import { WidgetCard } from '../components/WidgetCard';

const { useWidgetDataMock } = vi.hoisted(() => ({
  useWidgetDataMock: vi.fn(),
}));

vi.mock('../hooks/useWidgetData', () => ({
  useWidgetData: useWidgetDataMock,
}));

const loadedState = {
  config: {},
  data: {
    wallets: [
      {
        id: 'w1',
        name: 'Checking',
        color: '#1f8a4c',
        currency: 'USD',
        balance: '1250.50',
      },
      {
        id: 'w2',
        name: 'Savings',
        color: '#2f6fed',
        currency: 'EUR',
        balance: '800.00',
      },
    ],
  },
  loading: false,
  error: null,
};

describe('NetWorthWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders both currency totals', () => {
    useWidgetDataMock.mockReturnValue(loadedState);
    render(
      <WidgetCard title="Net Worth" icon={Wallet}>
        <NetWorthWidget />
      </WidgetCard>,
    );
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('renders a loading skeleton instead of the empty state while loading', () => {
    useWidgetDataMock.mockReturnValue({
      config: {},
      data: null,
      loading: true,
      error: null,
    });
    render(
      <WidgetCard title="Net Worth" icon={Wallet}>
        <NetWorthWidget />
      </WidgetCard>,
    );
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
    expect(screen.queryByText('No wallets yet')).not.toBeInTheDocument();
  });
});
