import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletSelectList } from './WalletSelectList';
import type { WalletData } from '../api/wallets';

beforeAll(() => {
  // jsdom does not implement ResizeObserver (used by ScrollArea)
  global.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

const wallets: WalletData[] = [
  {
    id: 'w1',
    name: 'Cash',
    description: '',
    color: '#1f8a4c',
    balance: '100.00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Bank',
    description: '',
    color: '#3b82f6',
    balance: '500.00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w3',
    name: 'Savings',
    description: '',
    color: '#f59e0b',
    balance: '1000.00',
    createdAt: '',
    updatedAt: '',
  },
];

describe('WalletSelectList', () => {
  it('renders all wallets as chips', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('renders chips with wallet color as border color', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    const cashChip = screen.getByText('Cash').closest('[data-testid="wallet-chip"]');
    expect(cashChip).toHaveStyle({ borderColor: '#1f8a4c', color: '#1f8a4c' });
  });

  it('highlights the selected wallet chip', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId="w2"
        onSelect={vi.fn()}
      />,
    );

    const bankChip = screen.getByText('Bank').closest('[data-testid="wallet-chip"]');
    // Selected chip should have a solid background (not outline)
    expect(bankChip).toHaveAttribute('data-selected', 'true');
  });

  it('calls onSelect when a chip is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText('Cash'));
    expect(onSelect).toHaveBeenCalledWith('w1');
  });

  it('shows empty state when no wallets provided', () => {
    render(
      <WalletSelectList
        wallets={[]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/no wallets/i)).toBeInTheDocument();
  });

  it('renders inside a horizontally scrollable container', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    const scrollArea = screen.getByRole('listbox');
    expect(scrollArea).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    // Focus the first chip directly
    const firstChip = screen.getByText('Cash').closest('[role="option"]')!;
    firstChip.focus();
    expect(document.activeElement).toBe(firstChip);

    // ArrowRight moves focus to second chip
    await user.keyboard('{ArrowRight}');
    const secondChip = screen.getByText('Bank').closest('[role="option"]')!;
    expect(document.activeElement).toBe(secondChip);

    // Enter on second chip selects it
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('w2');
  });
});
