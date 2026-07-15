import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletModal } from './WalletModal';

import type * as WalletModule from '../api/wallets';

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    getWallet: vi.fn(),
    createWallet: vi.fn(),
    updateWallet: vi.fn(),
    deleteWallet: vi.fn(),
  };
});

import { createWallet, getWallet, updateWallet } from '../api/wallets';

describe('WalletModal — create mode (no walletId)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders create form with name, description, and color fields', () => {
    render(
      <WalletModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />,
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    // No Delete button in create mode
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('calls createWallet and onSuccess on submit', async () => {
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
      <WalletModal open={true} onOpenChange={vi.fn()} onSuccess={onSuccess} />,
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

  it('shows Cancel button that closes the dialog', async () => {
    const onOpenChange = vi.fn();

    render(
      <WalletModal
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={vi.fn()}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

const mockWallet = {
  id: 'w1',
  name: 'Cash',
  description: 'Daily expenses',
  color: '#1f8a4c',
  balance: '100.00',
  createdAt: '',
  updatedAt: '',
};

describe('WalletModal — edit mode (walletId provided)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWallet).mockResolvedValue(mockWallet);
    cleanup();
  });

  it('renders loading state while fetching wallet', () => {
    vi.mocked(getWallet).mockImplementation(() => new Promise(() => {}));

    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('fetches wallet and prefills form fields', async () => {
    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getWallet).toHaveBeenCalledWith('w1');
    });
    expect(await screen.findByDisplayValue('Cash')).toBeInTheDocument();
  });

  it('renders Save Changes button disabled when form is not dirty', async () => {
    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    await screen.findByDisplayValue('Cash');

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('enables Save Changes when form becomes dirty', async () => {
    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    await screen.findByDisplayValue('Cash');

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Bank');

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).not.toBeDisabled();
  });

  it('calls updateWallet and onSuccess on save', async () => {
    vi.mocked(updateWallet).mockResolvedValue(mockWallet);
    const onSuccess = vi.fn();

    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={onSuccess}
      />,
    );

    await screen.findByDisplayValue('Cash');

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Bank');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateWallet).toHaveBeenCalledWith('w1', {
        name: 'Bank',
        description: 'Daily expenses',
        color: '#1f8a4c',
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('renders Delete button when walletId is provided', async () => {
    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete' }),
      ).toBeInTheDocument();
    });
  });

  it('shows error when wallet fetch fails', async () => {
    vi.mocked(getWallet).mockRejectedValue(new Error('Not found'));

    render(
      <WalletModal
        open={true}
        onOpenChange={vi.fn()}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load wallet.')).toBeInTheDocument();
    });
  });

  it('Cancel button calls onOpenChange(false)', async () => {
    const onOpenChange = vi.fn();

    render(
      <WalletModal
        open={true}
        onOpenChange={onOpenChange}
        walletId="w1"
        onSuccess={vi.fn()}
      />,
    );

    await screen.findByDisplayValue('Cash');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
