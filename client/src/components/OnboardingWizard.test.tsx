import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingWizard } from './OnboardingWizard';

import type * as WalletModule from '../api/wallets';
import type * as CatModule from '../api/categories';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    createWallet: vi.fn(),
  };
});
vi.mock('../api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof CatModule>();
  return {
    ...actual,
    createCategory: vi.fn(),
  };
});

import { createWallet } from '../api/wallets';
import { createCategory } from '../api/categories';

function renderWizard(onComplete?: () => void): void {
  render(
    <MemoryRouter>
      <OnboardingWizard
        open={true}
        onOpenChange={vi.fn()}
        onComplete={onComplete ?? vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createWallet).mockResolvedValue({
      id: 'w-new',
      name: 'My Wallet',
      description: '',
      color: '#1f8a4c',
      currency: 'USD',
      balance: '0',
      createdAt: '',
      updatedAt: '',
    });
    vi.mocked(createCategory).mockResolvedValue({
      id: 'c-new',
      userId: 'u1',
      name: 'Food',
      color: '#ff6b6b',
      icon: 'UtensilsCrossed',
      createdAt: '',
      updatedAt: '',
    });
    localStorage.clear();
    cleanup();
  });

  it('renders step 1 wallet creation form', async () => {
    renderWizard();
    expect(await screen.findByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Wallet name')).toBeInTheDocument();
  });

  it('auto-advances to step 2 after creating a wallet', async () => {
    renderWizard();
    await screen.findByText('Step 1 of 3');

    await userEvent.type(screen.getByLabelText('Wallet name'), 'My Wallet');
    await userEvent.click(
      screen.getByRole('button', { name: /create wallet/i }),
    );

    expect(await screen.findByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('auto-advances to step 3 after creating a category', async () => {
    renderWizard();
    await screen.findByText('Step 1 of 3');

    await userEvent.type(screen.getByLabelText('Wallet name'), 'My Wallet');
    await userEvent.click(
      screen.getByRole('button', { name: /create wallet/i }),
    );

    await screen.findByText('Step 2 of 3');
    await userEvent.type(screen.getByLabelText('Category name'), 'Food');
    await userEvent.click(
      screen.getByRole('button', { name: /create category/i }),
    );

    expect(await screen.findByText('Step 3 of 3')).toBeInTheDocument();
  });

  it('dismisses and stores wizardDismissed in localStorage', async () => {
    const onOpenChange = vi.fn();
    render(
      <MemoryRouter>
        <OnboardingWizard
          open={true}
          onOpenChange={onOpenChange}
          onComplete={vi.fn()}
        />
      </MemoryRouter>,
    );

    await screen.findByText('Step 1 of 3');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(localStorage.getItem('budgeto:wizardDismissed')).toBe('true');
  });

  it('calls onComplete after finishing step 3', async () => {
    const onComplete = vi.fn();
    renderWizard(onComplete);
    await screen.findByText('Step 1 of 3');

    await userEvent.type(screen.getByLabelText('Wallet name'), 'My Wallet');
    await userEvent.click(
      screen.getByRole('button', { name: /create wallet/i }),
    );

    await screen.findByText('Step 2 of 3');
    await userEvent.type(screen.getByLabelText('Category name'), 'Food');
    await userEvent.click(
      screen.getByRole('button', { name: /create category/i }),
    );

    await screen.findByText('Step 3 of 3');
    // onComplete is called with the created resources
    expect(onComplete).toHaveBeenCalledWith({
      walletId: 'w-new',
      categoryId: 'c-new',
    });
  });
});
