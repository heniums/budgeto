import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletDetailSheet } from './WalletDetailSheet';

import type * as WalletModule from '../api/wallets';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallet: vi.fn(),
    createWallet: vi.fn(),
    updateWallet: vi.fn(),
  };
});

import { getWallet, createWallet } from '../api/wallets';

const mockWallet = {
  id: 'w1',
  name: 'Cash',
  description: 'Daily expenses',
  color: '#1f8a4c',
  balance: '100.00',
  createdAt: '',
  updatedAt: '',
};

describe('WalletDetailSheet — create mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders create form when walletId is not provided', async () => {
    const onSuccess = vi.fn();
    render(
      <WalletDetailSheet
        walletId=""
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    // Should show a form for creating a wallet
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeInTheDocument();

    // Should show a submit button for creation
    const submitBtn = screen.getByRole('button', { name: 'Create' });
    expect(submitBtn).toBeInTheDocument();
  });

  it('calls createWallet API and onSuccess on submit', async () => {
    vi.mocked(createWallet).mockResolvedValue({
      id: 'w-new',
      name: 'Savings',
      description: '',
      color: '#2f6fed',
      balance: '0.00',
      createdAt: '',
      updatedAt: '',
    });
    const onSuccess = vi.fn();

    render(
      <WalletDetailSheet
        walletId=""
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Savings');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createWallet).toHaveBeenCalledWith({
        name: 'Savings',
        description: '',
        color: '#1f8a4c',
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('does not fetch wallet data in create mode', () => {
    render(
      <WalletDetailSheet
        walletId=""
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(getWallet).not.toHaveBeenCalled();
  });
});

describe('WalletDetailSheet — edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallet).mockResolvedValue(mockWallet);
    cleanup();
  });

  it('fetches and displays wallet data when walletId is provided', async () => {
    render(
      <WalletDetailSheet
        walletId="w1"
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getWallet).toHaveBeenCalledWith('w1');
    });
    expect(await screen.findByDisplayValue('Cash')).toBeInTheDocument();
  });

  it('renders Save button in edit mode', async () => {
    render(
      <WalletDetailSheet
        walletId="w1"
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });
});
