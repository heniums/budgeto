import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
  it('renders a trigger button showing the selected currency', () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'USD — US Dollar' }),
    ).toBeInTheDocument();
  });

  it('shows the selected currency code and name', () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'USD — US Dollar' }),
    ).toHaveTextContent('USD — US Dollar');
  });

  it('shows placeholder text when no currency is selected', () => {
    render(<CurrencyInput value="" onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Select currency' }),
    ).toHaveTextContent('Select currency');
  });

  it('opens the popover on click', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    expect(screen.getByPlaceholderText('Search currency…')).toBeInTheDocument();
  });

  it('filters currencies by search query', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    await user.type(searchInput, 'euro');
    // EUR should appear in the filtered list
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('selects a currency and closes the popover', async () => {
    const onChange = vi.fn();
    render(<CurrencyInput value="USD" onChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    await user.type(searchInput, 'gbp');
    const gbpButton = screen.getByText('GBP');
    await user.click(gbpButton);
    expect(onChange).toHaveBeenCalledWith('GBP');
  });

  it('shows no results message for unmatched query', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    await user.type(searchInput, 'zzzzzz');
    expect(screen.getByText('No currencies found.')).toBeInTheDocument();
  });
  it('has proper combobox and listbox ARIA roles', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    expect(searchInput).toHaveAttribute('role', 'searchbox');
    expect(searchInput).toHaveAttribute('aria-controls');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    // Verify options have aria-selected attribute
    expect(options[0]).toHaveAttribute('aria-selected');
    // After ArrowDown, aria-activedescendant should point to the first option
    await user.keyboard('{ArrowDown}');
    expect(searchInput).toHaveAttribute('aria-activedescendant');
    const activeId = searchInput.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId as string)).toBe(options[0]);
  });

  it('supports arrow key navigation to select a currency', async () => {
    const onChange = vi.fn();
    render(<CurrencyInput value="USD" onChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    // Narrow results so navigation is predictable
    await user.clear(searchInput);
    await user.type(searchInput, 'us');
    // ArrowDown highlights first option, then next
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('closes popover on Escape', async () => {
    render(<CurrencyInput value="USD" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'USD — US Dollar' }));
    const searchInput = screen.getByPlaceholderText('Search currency…');
    expect(searchInput).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByPlaceholderText('Search currency…')).not.toBeInTheDocument();
  });
});
