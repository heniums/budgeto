import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TransactionForm } from '../components/TransactionForm';

import type * as WalletModule from '../api/wallets';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    createTransaction: vi.fn(),
  };
});

import { createTransaction } from '../api/wallets';

const wallets = [
  { id: 'w1', name: 'Cash', description: '', color: '#1f8a4c', balance: '100.00', createdAt: '', updatedAt: '' },
  { id: 'w2', name: 'Savings', description: '', color: '#2f6fed', balance: '50.00', createdAt: '', updatedAt: '' },
];

const onSuccess = vi.fn();

function renderForm(): void {
  render(
    <MemoryRouter>
      <TransactionForm wallets={wallets} token="tok" onSuccess={onSuccess} />
    </MemoryRouter>,
  );
}

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTransaction).mockResolvedValue({
      id: 't1',
      walletId: 'w1',
      amount: '50.00',
      description: 'Test',
      createdAt: '',
    });
    cleanup();
  });

  it('renders wallet selector, amount, and description fields', () => {
    renderForm();
    expect(screen.getByLabelText('Wallet')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('requires wallet selection', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Amount'), '50');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(
      await screen.findByRole('alert'),
    ).toBeInTheDocument();
    expect(vi.mocked(createTransaction)).not.toHaveBeenCalled();
  });

  it('requires an amount', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText('Wallet'), 'w1');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(
      await screen.findByText(/amount is required/i),
    ).toBeInTheDocument();
    expect(vi.mocked(createTransaction)).not.toHaveBeenCalled();
  });

  it('creates a transaction and calls onSuccess', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText('Wallet'), 'w1');
    await user.type(screen.getByLabelText('Amount'), '-25.50');
    await user.type(screen.getByLabelText('Description'), 'Groceries');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(vi.mocked(createTransaction)).toHaveBeenCalledWith('tok', 'w1', {
        amount: '-25.50',
        description: 'Groceries',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
