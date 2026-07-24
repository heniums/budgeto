import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorInput } from './ColorInput';

describe('ColorInput', () => {
  it('renders a trigger button showing the current hex value', () => {
    render(<ColorInput value="#ff0000" onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: '#ff0000' }),
    ).toBeInTheDocument();
  });

  it('shows the current hex value in the trigger', () => {
    render(<ColorInput value="#1f8a4c" onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: '#1f8a4c' }),
    ).toHaveTextContent('#1f8a4c');
  });

  it('opens the popover on click', async () => {
    render(<ColorInput value="#ff0000" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '#ff0000' }));
    // Popover content renders in a portal, should be in the document
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('calls onChange when a preset color is clicked', async () => {
    const onChange = vi.fn();
    render(<ColorInput value="#ff0000" onChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '#ff0000' }));
    // Click the first preset (#1f8a4c)
    const presets = screen.getAllByTitle('#1f8a4c');
    if (presets.length > 0) {
      await user.click(presets[0]);
    }
    expect(onChange).toHaveBeenCalledWith('#1f8a4c');
  });

  it('renders a custom color input inside the popover', async () => {
    render(<ColorInput value="#ff0000" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '#ff0000' }));
    // The native color input is present
    const nativeColorInput = document.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    expect(nativeColorInput).toBeInTheDocument();
    expect(nativeColorInput.value).toBe('#ff0000');
  });

  it('preset color buttons have aria-label and aria-pressed', async () => {
    render(<ColorInput value="#1f8a4c" onChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '#1f8a4c' }));
    const activePreset = screen.getByRole('button', { name: '#1f8a4c', pressed: true });
    expect(activePreset).toBeInTheDocument();
    const inactivePreset = screen.getByRole('button', { name: '#ef4444', pressed: false });
    expect(inactivePreset).toBeInTheDocument();
  });
});
