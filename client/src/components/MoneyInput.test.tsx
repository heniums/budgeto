import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from './MoneyInput';

describe('MoneyInput', () => {
  it('renders an input with type text and decimal inputMode', () => {
    render(<MoneyInput value="" onChange={vi.fn()} currency="USD" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputMode', 'decimal');
  });

  it('displays formatted value when not focused', () => {
    render(<MoneyInput value="42.50" onChange={vi.fn()} currency="USD" />);
    expect(screen.getByRole('textbox')).toHaveValue('$42.50');
  });

  it('displays raw value when focused', async () => {
    render(<MoneyInput value="42.50" onChange={vi.fn()} currency="USD" />);
    const input = screen.getByRole('textbox');
    const user = userEvent.setup();
    await user.click(input);
    expect(input).toHaveValue('42.50');
  });

  it('formats value on blur with the given currency', () => {
    render(<MoneyInput value="1000" onChange={vi.fn()} currency="EUR" />);
    expect(screen.getByRole('textbox')).toHaveValue('€1,000.00');
  });

  it('calls onChange with the raw typed value', async () => {
    const onChange = vi.fn();
    render(<MoneyInput value="" onChange={onChange} currency="USD" />);
    const user = userEvent.setup();
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.type(input, '100');
    expect(onChange).toHaveBeenCalled();
  });

  it('uses the default placeholder when none is provided', () => {
    render(<MoneyInput value="" onChange={vi.fn()} currency="USD" />);
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('uses a custom placeholder when provided', () => {
    render(
      <MoneyInput
        value=""
        onChange={vi.fn()}
        placeholder="Enter amount"
        currency="USD"
      />,
    );
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('forwards aria-label and other HTML input attributes to the inner input', () => {
    render(
      <MoneyInput
        value=""
        onChange={vi.fn()}
        aria-label="Initial Balance"
        data-testid="money"
        autoComplete="off"
        currency="USD"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Initial Balance' });
    expect(input).toHaveAttribute('aria-label', 'Initial Balance');
    expect(input).toHaveAttribute('data-testid', 'money');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });
});
