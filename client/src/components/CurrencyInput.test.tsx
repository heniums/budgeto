import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
  it('renders a trigger button with aria-label Currency', () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });

  it('shows the selected currency code and name', () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Currency')).toHaveTextContent(
      'USD — US Dollar',
    );
  });

  it('shows placeholder text when no currency is selected', () => {
    render(<CurrencyInput value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Currency')).toHaveTextContent(
      'Select currency',
    );
  });

  it('opens the popover on click', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Currency'));
    expect(screen.getByPlaceholderText('Search currency…')).toBeInTheDocument();
  });

  it('filters currencies by search query', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Currency'));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    await user.type(searchInput, 'euro');
    // EUR should appear in the filtered list
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('selects a currency and closes the popover', async () => {
    const onChange = vi.fn();
    render(<CurrencyInput value="USD" onChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Currency'));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    await user.type(searchInput, 'gbp');
    const gbpButton = screen.getByText('GBP');
    await user.click(gbpButton);
    expect(onChange).toHaveBeenCalledWith('GBP');
  });

  it('shows no results message for unmatched query', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Currency'));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    await user.type(searchInput, 'zzzzzz');
    expect(screen.getByText('No currencies found.')).toBeInTheDocument();
  });
});
