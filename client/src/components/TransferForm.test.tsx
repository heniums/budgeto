import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TransferForm } from './TransferForm';

import type * as WalletModule from '../api/wallets';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    transferFunds: vi.fn(),
  };
});

import { transferFunds } from '../api/wallets';

const mockTransferFunds = vi.mocked(transferFunds);

const wallets: WalletModule.WalletData[] = [
  {
    id: 'w1',
    name: 'Cash',
    description: '',
    color: '#1f8a4c',
    currency: 'USD',
    balance: '100.00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Savings',
    description: '',
    color: '#2563eb',
    currency: 'USD',
    balance: '500.00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w3',
    name: 'Investment',
    description: '',
    color: '#9333ea',
    currency: 'USD',
    balance: '1000.00',
    createdAt: '',
    updatedAt: '',
  },
];

function renderForm(props?: { onSuccess?: () => void }): void {
  render(
    <MemoryRouter>
      <TransferForm wallets={wallets} onSuccess={props?.onSuccess ?? vi.fn()} />
    </MemoryRouter>,
  );
}

describe('TransferForm', () => {
  beforeEach(() => {
    mockTransferFunds.mockReset();
  });

  it('blocks submit when source and target wallets are the same', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w1');
    await user.type(screen.getByLabelText('Amount'), '50');

    await user.click(screen.getByRole('button', { name: /transfer/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Source and target wallets must be different.'),
      ).toBeInTheDocument();
    });
    expect(mockTransferFunds).not.toHaveBeenCalled();
  });

  it('blocks submit when amount is not positive', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w2');
    await user.type(screen.getByLabelText('Amount'), '0');

    await user.click(screen.getByRole('button', { name: /transfer/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Amount must be a positive number.'),
      ).toBeInTheDocument();
    });
    expect(mockTransferFunds).not.toHaveBeenCalled();
  });

  it('calls transferFunds with correct payload on successful submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockTransferFunds.mockResolvedValue({
      sourceTransaction: {} as never,
      targetTransaction: {} as never,
    });
    renderForm({ onSuccess });

    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w2');
    await user.type(screen.getByLabelText('Amount'), '75.50');
    await user.type(screen.getByLabelText('Description'), 'Moving rent money');

    await user.click(screen.getByRole('button', { name: /transfer/i }));

    await waitFor(() => {
      expect(mockTransferFunds).toHaveBeenCalledWith({
        sourceId: 'w1',
        targetId: 'w2',
        amount: '75.50',
        description: 'Moving rent money',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('displays API error via FormAlert when transferFunds rejects', async () => {
    const user = userEvent.setup();
    mockTransferFunds.mockRejectedValue(
      new (await import('../api/client')).ApiError(
        'Insufficient balance.',
        400,
      ),
    );
    renderForm();

    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w2');
    await user.type(screen.getByLabelText('Amount'), '999');

    await user.click(screen.getByRole('button', { name: /transfer/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Insufficient balance.',
      );
    });
  });

  it('resets form and calls onSuccess after successful submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockTransferFunds.mockResolvedValue({
      sourceTransaction: {} as never,
      targetTransaction: {} as never,
    });
    renderForm({ onSuccess });

    // Fill the form
    await user.selectOptions(screen.getByLabelText('From'), 'w1');
    await user.selectOptions(screen.getByLabelText('To'), 'w2');
    await user.type(screen.getByLabelText('Amount'), '100');
    await user.type(screen.getByLabelText('Description'), 'Test transfer');

    // Submit
    await user.click(screen.getByRole('button', { name: /transfer/i }));

    await waitFor(() => {
      expect(mockTransferFunds).toHaveBeenCalled();
    });

    // Form should be reset: selects back to empty placeholder
    await waitFor(() => {
      const fromSelect = screen.getByLabelText('From') as HTMLSelectElement;
      expect(fromSelect.value).toBe('');
    });

    await waitFor(() => {
      const toSelect = screen.getByLabelText('To') as HTMLSelectElement;
      expect(toSelect.value).toBe('');
    });

    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    expect(amountInput.value).toBe('');

    const descInput = screen.getByLabelText('Description') as HTMLInputElement;
    expect(descInput.value).toBe('');

    expect(onSuccess).toHaveBeenCalled();
  });
});
