import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletSelectList } from './WalletSelectList';

import type * as WalletModule from '../api/wallets';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    updateWallet: vi.fn(),
    createWallet: vi.fn(),
  };
});

import { updateWallet, createWallet } from '../api/wallets';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

interface WalletItem {
  id: string;
  name: string;
  color: string;
  description: string;
}

const wallets: WalletItem[] = [
  {
    id: 'w1',
    name: 'Cash',
    description: 'Physical cash',
    color: '#1f8a4c',
  },
  {
    id: 'w2',
    name: 'Bank',
    description: 'Main bank account',
    color: '#3b82f6',
  },
  {
    id: 'w3',
    name: 'Savings',
    description: '',
    color: '#f59e0b',
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
    const firstChip = screen.getByText('Cash').closest('[role="option"]') as HTMLElement;
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

describe('WalletSelectList — dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateWallet).mockResolvedValue({
      id: 'w1',
      name: 'Cash Updated',
      description: '',
      color: '#1f8a4c',
      balance: '100.00',
      createdAt: '',
      updatedAt: '',
    });
    vi.mocked(createWallet).mockResolvedValue({
      id: 'w-new',
      name: 'New Wallet',
      description: '',
      color: '#1f8a4c',
      balance: '0.00',
      createdAt: '',
      updatedAt: '',
    });
  });

  it('shows "+" button at the end of the chip list', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Add wallet')).toBeInTheDocument();
  });

  it('shows "View All" button when there are wallets', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('View all wallets')).toBeInTheDocument();
  });

  it('opens edit dialog on long-press', async () => {
    vi.useFakeTimers();
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    const cashChip = screen.getByText('Cash').closest('[role="option"]')!;
    fireEvent.pointerDown(cashChip);
    vi.advanceTimersByTime(600);
    fireEvent.pointerUp(cashChip);

    await waitFor(() => {
      expect(screen.getByText(/edit wallet/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('prefills edit dialog with wallet values', async () => {
    vi.useFakeTimers();
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    const cashChip = screen.getByText('Cash').closest('[role="option"]')!;
    fireEvent.pointerDown(cashChip);
    vi.advanceTimersByTime(600);
    fireEvent.pointerUp(cashChip);

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      expect(nameInput.value).toBe('Cash');
    });

    vi.useRealTimers();
  });
});
