import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TransactionForm } from './TransactionForm';

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
  {
    id: 'w1',
    name: 'Cash',
    description: '',
    color: '#1f8a4c',
    balance: '100.00',
    createdAt: '',
    updatedAt: '',
  },
];

function renderForm(props?: {
  wallets?: typeof wallets;
  categoriesCount?: number;
}): void {
  render(
    <MemoryRouter>
      <TransactionForm
        wallets={props?.wallets ?? wallets}
        categoriesCount={props?.categoriesCount}
        onSuccess={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('TransactionForm — prerequisite warnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTransaction).mockResolvedValue({
      id: 't-new',
      walletId: 'w1',
      amount: '50.00',
      description: 'Test',
      categoryId: null,
      createdAt: '',
    });
    cleanup();
  });

  it('disables submit and shows warning when no wallets exist', async () => {
    renderForm({ wallets: [] });
    expect(await screen.findByText(/you need a wallet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add transaction/i }),
    ).toBeDisabled();
  });

  it('shows category warning but keeps submit enabled when no categories', async () => {
    renderForm({ wallets, categoriesCount: 0 });
    expect(
      await screen.findByText(/you have no categories yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add transaction/i }),
    ).not.toBeDisabled();
  });

  it('shows no warnings when wallets and categories exist', () => {
    renderForm({ wallets, categoriesCount: 2 });
    expect(screen.queryByText(/you need a wallet/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/you have no categories yet/i),
    ).not.toBeInTheDocument();
  });

  it('calls onCreateWallet when Create one link is clicked', async () => {
    const onCreateWallet = vi.fn();
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          onSuccess={vi.fn()}
          onCreateWallet={onCreateWallet}
        />
      </MemoryRouter>,
    );
    const link = await screen.findByText(/create one/i);
    link.click();
    expect(onCreateWallet).toHaveBeenCalled();
  });

  it('calls onCreateCategory when Create one link is clicked', async () => {
    const onCreateCategory = vi.fn();
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categoriesCount={2}
          onSuccess={vi.fn()}
          onCreateCategory={onCreateCategory}
        />
      </MemoryRouter>,
    );
    const links = await screen.findAllByText(/create one/i);
    const catLink = links[links.length - 1];
    catLink.click();
    expect(onCreateCategory).toHaveBeenCalled();
  });

  it('auto-selects wallet when autoSelectWalletId prop is provided', async () => {
    const walletsWithNew = [
      ...wallets,
      {
        id: 'w-new',
        name: 'Savings',
        description: '',
        color: '#2f6fed',
        balance: '0.00',
        createdAt: '',
        updatedAt: '',
      },
    ];
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={walletsWithNew}
          onSuccess={vi.fn()}
          autoSelectWalletId="w-new"
        />
      </MemoryRouter>,
    );

    const select = screen.getByLabelText('Wallet') as HTMLSelectElement;
    expect(select.value).toBe('w-new');
  });

  it('renders category dropdown when categories are provided', () => {
    const categories = [
      { id: 'c1', name: 'Food', type: 'expense' as const, color: '#ff6b6b' },
      { id: 'c2', name: 'Salary', type: 'income' as const, color: '#1f8a4c' },
    ];
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onSuccess={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('auto-selects category when autoSelectCategoryId prop is provided', () => {
    const categories = [
      { id: 'c1', name: 'Food', type: 'expense' as const, color: '#ff6b6b' },
      { id: 'c2', name: 'Salary', type: 'income' as const, color: '#1f8a4c' },
    ];
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onSuccess={vi.fn()}
          autoSelectCategoryId="c2"
        />
      </MemoryRouter>,
    );

    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select.value).toBe('c2');
  });
});
