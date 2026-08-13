import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Wallet } from 'lucide-react';
import { NetWorthWidget } from './NetWorthWidget';
import { WidgetCard } from '../components/WidgetCard';

vi.mock('../hooks/useWidgetData', () => ({
  useWidgetData: () => ({
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
  }),
}));

describe('NetWorthWidget', () => {
  it('renders both currency totals', () => {
    render(
      <WidgetCard title="Net Worth" icon={Wallet}>
        <NetWorthWidget />
      </WidgetCard>,
    );
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });
});
