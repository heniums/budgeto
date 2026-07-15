import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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

describe('WalletModal — create mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders create form with name, description, and color fields', () => {
    render(
      <WalletModal
        mode="create"
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
