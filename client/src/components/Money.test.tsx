import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Money } from './Money';

describe('Money', () => {
  it('renders formatted USD', () => {
    render(<Money amount="50" currency="USD" />);
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('renders formatted EUR', () => {
    render(<Money amount="50" currency="EUR" />);
    expect(screen.getByText('€50.00')).toBeInTheDocument();
  });

  it('applies destructive color for negative amounts', () => {
    render(<Money amount="-50" currency="USD" />);
    const span = screen.getByText('-$50.00');
    expect(span.className).toContain('text-destructive');
  });

  it('applies foreground color for positive amounts', () => {
    render(<Money amount="50" currency="USD" />);
    const span = screen.getByText('$50.00');
    expect(span.className).toContain('text-foreground');
  });

  it('accepts an additional className', () => {
    render(<Money amount="50" currency="USD" className="font-bold" />);
    const span = screen.getByText('$50.00');
    expect(span.className).toContain('font-bold');
  });
});
