import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TransactionForm } from './TransactionForm';

import type * as TransactionsModule from '../api/transactions';
import type * as WalletModule from '../api/wallets';
import type * as CategoryModule from '../api/categories';

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TransactionsModule>();
  return {
    ...actual,
    createTransaction: vi.fn(),
  };
});

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallets: vi.fn(),
  };
});

vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CategoryModule>();
  return {
    ...actual,
    getCategories: vi.fn(),
  };
});

import { createTransaction } from '../api/transactions';
import { getWallets } from '../api/wallets';
import { getCategories } from '../api/categories';

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

const categories = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    userId: 'u1',
    name: 'Food',
    type: 'expense' as const,
    color: '#ff0000',
    icon: 'Tag',
    createdAt: '',
    updatedAt: '',
  },
];

function renderForm(): void {
  render(
    <MemoryRouter>
      <TransactionForm wallets={wallets} onSuccess={onSuccess} />
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
      categoryId: null,
      createdAt: '',
    });
    vi.mocked(getWallets).mockResolvedValue({ wallets });
    vi.mocked(getCategories).mockResolvedValue({ categories });
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
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(vi.mocked(createTransaction)).not.toHaveBeenCalled();
  });

  it('requires an amount', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText('Wallet'), 'w1');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(await screen.findByText(/amount is required/i)).toBeInTheDocument();
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
      expect(vi.mocked(createTransaction)).toHaveBeenCalledWith('w1', {
        amount: '-25.50',
        description: 'Groceries',
        categoryId: undefined,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('self-fetches wallets/categories and submits with a category', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TransactionForm onSuccess={onSuccess} />
      </MemoryRouter>,
    );
    const categorySelect = await screen.findByLabelText('Category');
    await user.selectOptions(screen.getByLabelText('Wallet'), 'w1');
    await user.selectOptions(
      categorySelect,
      '11111111-1111-1111-1111-111111111111',
    );
    await user.type(screen.getByLabelText('Amount'), '12.00');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(vi.mocked(createTransaction)).toHaveBeenCalledWith('w1', {
        amount: '12.00',
        description: '',
        categoryId: '11111111-1111-1111-1111-111111111111',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
