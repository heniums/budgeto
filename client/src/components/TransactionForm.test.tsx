import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TransactionForm } from './TransactionForm';

import type * as WalletModule from '../api/wallets';
import type * as TxModule from '../api/transactions';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    createTransaction: vi.fn(),
  };
});

vi.mock('../api/transactions', async (importOriginal) => {
  const actual = await importOriginal<typeof TxModule>();
  return {
    ...actual,
    updateTransaction: vi.fn(),
  };
});

import { createTransaction } from '../api/wallets';
import { updateTransaction } from '../api/transactions';

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
    const link = screen.getByText("Don't see your wallet? Create one →");
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
    // Last link is under the description section
    const catLink = links[links.length - 1];
    catLink.click();
    expect(onCreateCategory).toHaveBeenCalled();
  });

  it('calls onCreateWallet when warning Create one is clicked (no wallets)', async () => {
    const onCreateWallet = vi.fn();
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={[]}
          onSuccess={vi.fn()}
          onCreateWallet={onCreateWallet}
        />
      </MemoryRouter>,
    );
    const links = await screen.findAllByText(/create one/i);
    // The warning span is the first one
    const warnLink = links[0];
    warnLink.click();
    expect(onCreateWallet).toHaveBeenCalled();
  });

  it('calls onCreateCategory when warning Create one is clicked (no categories)', async () => {
    const onCreateCategory = vi.fn();
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categoriesCount={0}
          onSuccess={vi.fn()}
          onCreateCategory={onCreateCategory}
        />
      </MemoryRouter>,
    );
    const links = await screen.findAllByText(/create one/i);
    // The warning "Create one →" should be clickable
    expect(onCreateCategory).not.toHaveBeenCalled();
    links[0].click();
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

    const chip = screen.getByText('Savings').closest('[data-testid="wallet-chip"]');
    expect(chip).toHaveAttribute('data-selected', 'true');
  });

  it('renders category chips when categories are provided', () => {
    const categories = [
      { id: 'c1', name: 'Food', type: 'expense' as const, color: '#ff6b6b', icon: 'UtensilsCrossed' },
      { id: 'c2', name: 'Salary', type: 'income' as const, color: '#1f8a4c', icon: 'BriefcaseBusiness' },
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

    // Category chips rendered as buttons with aria-label
    expect(screen.getByLabelText('Food')).toBeInTheDocument();
    expect(screen.getByLabelText('Salary')).toBeInTheDocument();
  });

  it('auto-selects category when autoSelectCategoryId prop is provided', () => {
    const categories = [
      { id: 'c1', name: 'Food', type: 'expense' as const, color: '#ff6b6b', icon: 'UtensilsCrossed' },
      { id: 'c2', name: 'Salary', type: 'income' as const, color: '#1f8a4c', icon: 'BriefcaseBusiness' },
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

    const chip = screen.getByLabelText('Salary');
    expect(chip).toHaveAttribute('data-selected', 'true');
  });
});

describe('TransactionForm — edit mode', () => {
  const categories = [
    { id: 'c1', name: 'Food', type: 'expense' as const, color: '#ff6b6b', icon: 'UtensilsCrossed' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTransaction).mockResolvedValue({
      id: 't-edit',
      walletId: 'w1',
      amount: '200.00',
      description: 'Updated desc',
      categoryId: 'c1',
      categoryName: 'Food',
      createdAt: '2024-01-01',
    });
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

  it('pre-fills fields from initialValues in edit mode', () => {
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onSuccess={vi.fn()}
          editMode
          initialValues={{
            walletId: 'w1',
            amount: '42.50',
            description: 'Groceries',
            categoryId: 'c1',
          }}
          editTxId="t-edit"
        />
      </MemoryRouter>,
    );

    // Wallet chip should be selected
    const walletChip = screen.getByText('Cash').closest('[data-testid="wallet-chip"]');
    expect(walletChip).toHaveAttribute('data-selected', 'true');

    // Amount and description still use Input components
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    const descInput = screen.getByLabelText('Description') as HTMLInputElement;
    expect(amountInput.value).toBe('42.50');
    expect(descInput.value).toBe('Groceries');

    // Category chip should be selected
    const categoryChip = screen.getByLabelText('Food');
    expect(categoryChip).toHaveAttribute('data-selected', 'true');
  });

  it('shows "Save changes" button in edit mode', () => {
    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onSuccess={vi.fn()}
          editMode
          initialValues={{
            walletId: 'w1',
            amount: '10',
            description: '',
            categoryId: '',
          }}
          editTxId="t-edit"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add transaction/i }),
    ).not.toBeInTheDocument();
  });

  it('calls updateTransaction on submit in edit mode', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onSuccess={onSuccess}
          editMode
          initialValues={{
            walletId: 'w1',
            amount: '100',
            description: 'Old',
            categoryId: '',
          }}
          editTxId="t-edit"
        />
      </MemoryRouter>,
    );

    // Modify a field to enable Save (isDirty detection)
    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    await user.clear(amountInput);
    await user.type(amountInput, '200');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(updateTransaction).toHaveBeenCalledWith('t-edit', {
      amount: '200',
      description: 'Old',
      categoryId: undefined,
      walletId: 'w1',
    });
    expect(createTransaction).not.toHaveBeenCalled();
  });
});
