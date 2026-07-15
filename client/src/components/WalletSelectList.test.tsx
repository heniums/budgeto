import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletSelectList } from './WalletSelectList';

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

describe('WalletSelectList — rendering', () => {
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

    const cashChip = screen
      .getByText('Cash')
      .closest('[data-testid="wallet-chip"]');
    expect(cashChip).toHaveStyle({
      borderColor: '#1f8a4c',
      color: '#1f8a4c',
    });
  });

  it('highlights the selected wallet chip', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId="w2"
        onSelect={vi.fn()}
      />,
    );

    const bankChip = screen
      .getByText('Bank')
      .closest('[data-testid="wallet-chip"]');
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

    const firstChip = screen
      .getByText('Cash')
      .closest('[role="option"]') as HTMLElement;
    firstChip.focus();
    expect(document.activeElement).toBe(firstChip);

    await user.keyboard('{ArrowRight}');
    const secondChip = screen.getByText('Bank').closest('[role="option"]');
    if (!secondChip) throw new Error('second chip not found');
    expect(document.activeElement).toBe(secondChip);

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('w2');
  });
});

describe('WalletSelectList — callbacks', () => {
  it('calls onCreate when "+" button is clicked', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();

    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
        onCreate={onCreate}
      />,
    );

    await user.click(screen.getByLabelText('Add wallet'));
    expect(onCreate).toHaveBeenCalled();
  });

  it('calls onViewAll when grid button is clicked', async () => {
    const onViewAll = vi.fn();
    const user = userEvent.setup();

    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
        onViewAll={onViewAll}
      />,
    );

    await user.click(screen.getByLabelText('View all wallets'));
    expect(onViewAll).toHaveBeenCalled();
  });

  it('calls onEdit when Shift+Enter is pressed on a chip', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
        onEdit={onEdit}
      />,
    );

    const cashChip = screen
      .getByText('Cash')
      .closest('[role="option"]') as HTMLElement;
    cashChip.focus();
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onEdit).toHaveBeenCalledWith({
      id: 'w1',
      name: 'Cash',
      color: '#1f8a4c',
      description: 'Physical cash',
    });
  });

  it('hides "+" button when onCreate is not provided', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText('Add wallet'),
    ).not.toBeInTheDocument();
  });

  it('hides "View All" button when onViewAll is not provided', () => {
    render(
      <WalletSelectList
        wallets={wallets}
        selectedId={null}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText('View all wallets'),
    ).not.toBeInTheDocument();
  });
});
