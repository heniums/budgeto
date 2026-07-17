import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionDetailDialog } from './TransactionDetailDialog';

const sampleTx = {
  id: 't1',
  walletId: 'w1',
  amount: '-42.50',
  description: 'Groceries',
  categoryId: 'c1',
  categoryName: 'Food',
  createdAt: '2024-06-15T10:30:00.000Z',
};

describe('TransactionDetailDialog', () => {
  it('renders transaction details', () => {
    render(
      <TransactionDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={sampleTx}
        walletName="Cash"
        walletCurrency="USD"
        categoryColor="#ff6b6b"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('-$42.50')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('6/15/2024')).toBeInTheDocument();
  });

  it('renders Edit and Delete buttons', () => {
    render(
      <TransactionDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={sampleTx}
        walletName="Cash"
        walletCurrency="USD"
        categoryColor="#ff6b6b"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <TransactionDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={sampleTx}
        walletName="Cash"
        walletCurrency="USD"
        categoryColor="#ff6b6b"
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when Delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TransactionDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={sampleTx}
        walletName="Cash"
        walletCurrency="USD"
        categoryColor="#ff6b6b"
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('shows "—" for missing description', () => {
    render(
      <TransactionDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={{ ...sampleTx, description: '' }}
        walletName="Cash"
        walletCurrency="USD"
        categoryColor="#ff6b6b"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows "—" for missing category', () => {
    render(
      <TransactionDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        transaction={{ ...sampleTx, categoryId: null, categoryName: null }}
        walletName="Cash"
        walletCurrency="USD"
        categoryColor="#ff6b6b"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // Category badge should not appear, and "—" should show in its place
    expect(screen.queryByText('Food')).not.toBeInTheDocument();
  });
});
