import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonthlyCashFlowWidget } from './MonthlyCashFlowWidget';

interface ChartProps {
  data: { datasets: { label: string }[] };
  options: Record<string, unknown>;
}

const mockLine = vi.fn((_props: ChartProps) => null);

vi.mock('react-chartjs-2', () => ({
  Line: (props: ChartProps) => mockLine(props),
  Bar: () => null,
  Doughnut: () => null,
}));

vi.mock('../hooks/useWidgetData', () => ({
  useWidgetData: () => ({
    config: { interval: 'month' },
    data: {
      interval: 'month',
      rows: [
        { period: '2026-02-01', income: '1000', expense: '500', net: '500' },
        { period: '2026-03-01', income: '1200', expense: '600', net: '600' },
        { period: '2026-04-01', income: '800', expense: '400', net: '400' },
        { period: '2026-05-01', income: '1500', expense: '700', net: '800' },
        { period: '2026-06-01', income: '1100', expense: '550', net: '550' },
        { period: '2026-07-01', income: '1300', expense: '650', net: '650' },
      ],
    },
    loading: false,
    error: null,
  }),
}));

describe('MonthlyCashFlowWidget', () => {
  it('renders the chart with 3 datasets', () => {
    render(<MonthlyCashFlowWidget />);
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(mockLine).toHaveBeenCalledTimes(1);
    const callProps = mockLine.mock.calls[0][0] as ChartProps;
    expect(callProps.data.datasets).toHaveLength(3);
    expect(callProps.data.datasets[0].label).toBe('Income');
    expect(callProps.data.datasets[1].label).toBe('Expense');
    expect(callProps.data.datasets[2].label).toBe('Net');
  });
});
