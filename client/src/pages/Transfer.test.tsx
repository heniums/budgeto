import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Transfer } from './Transfer';

import type * as TransactionsModule from '../api/transactions';

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TransactionsModule>();
  return {
    ...actual,
    transferFunds: vi.fn(),
  };
});

import { transferFunds } from '../api/transactions';

const wallets = [
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
    name: 'Savings',
    description: '',
    color: '#2f6fed',
    balance: '50.00',
    createdAt: '',
    updatedAt: '',
  },
];

const onSuccess = vi.fn();

function renderForm(): void {
  render(
    <MemoryRouter>
      <Transfer wallets={wallets} onSuccess={onSuccess} />
    </MemoryRouter>,
  );
}

describe('TransferForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transferFunds).mockResolvedValue({
      sourceTransaction: {
        id: 't1',
        walletId: 'w1',
        amount: '-25.00',
        description: 'Transfer',
        createdAt: '',
      },
      targetTransaction: {
        id: 't2',
        walletId: 'w2',
        amount: '25.00',
        description: 'Transfer',
        createdAt: '',
      },
    });
    cleanup();
  });

  it('renders source, target, amount, and description fields', () => {
    renderForm();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('requires source and target wallets', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Amount'), '50');
    await user.click(screen.getByRole('button', { name: /transfer/i }));
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(vi.mocked(transferFunds)).not.toHaveBeenCalled();
  });

  it('requires an amount', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w2');
    await user.click(screen.getByRole('button', { name: /transfer/i }));
    expect(await screen.findByText(/amount is required/i)).toBeInTheDocument();
    expect(vi.mocked(transferFunds)).not.toHaveBeenCalled();
  });

  it('executes a transfer and calls onSuccess', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w2');
    await user.type(screen.getByLabelText('Amount'), '25');
    await user.type(screen.getByLabelText('Description'), 'Move');
    await user.click(screen.getByRole('button', { name: /transfer/i }));

    await waitFor(() => {
      expect(vi.mocked(transferFunds)).toHaveBeenCalledWith({
        sourceId: 'w1',
        targetId: 'w2',
        amount: '25',
        description: 'Move',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
