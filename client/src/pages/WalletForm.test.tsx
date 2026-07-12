import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { WalletForm } from './WalletForm';

import type * as AuthModule from '../api/auth';
import type * as WalletModule from '../api/wallets';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});

vi.mock('../api/wallets', async (importOriginal) => {
  const actual = await importOriginal<typeof WalletModule>();
  return {
    ...actual,
    createWallet: vi.fn(),
    getWallet: vi.fn(),
    updateWallet: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { createWallet, getWallet, updateWallet } from '../api/wallets';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderCreate(): void {
  window.localStorage.setItem('budgeto.token', 'tok');
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account/wallets/new']}>
        <Routes>
          <Route path="/account/wallets/new" element={<WalletForm />} />
          <Route
            path="/account/wallets/:id"
            element={<div>Wallet Detail</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function renderEdit(): void {
  window.localStorage.setItem('budgeto.token', 'tok');
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account/wallets/w1/edit']}>
        <Routes>
          <Route
            path="/account/wallets/:id/edit"
            element={<WalletForm />}
          />
          <Route
            path="/account/wallets/:id"
            element={<div>Wallet Detail</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('WalletForm — create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(createWallet).mockResolvedValue({
      id: 'new-id',
      name: '',
      description: '',
      color: '',
      balance: '0',
      createdAt: '',
      updatedAt: '',
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders the create heading', async () => {
    renderCreate();
    expect(await screen.findByText('New Wallet')).toBeInTheDocument();
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    renderCreate();
    await screen.findByText('New Wallet');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(
      await screen.findByText(/name is required/i),
    ).toBeInTheDocument();
    expect(vi.mocked(createWallet)).not.toHaveBeenCalled();
  });

  it('creates a wallet and navigates to detail page', async () => {
    const user = userEvent.setup();
    vi.mocked(createWallet).mockResolvedValue({
      id: 'new-id',
      name: 'My Wallet',
      description: '',
      color: '#1f8a4c',
      balance: '0',
      createdAt: '',
      updatedAt: '',
    });
    renderCreate();
    await screen.findByText('New Wallet');
    await user.type(screen.getByLabelText('Name'), 'My Wallet');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(vi.mocked(createWallet)).toHaveBeenCalledWith({
        name: 'My Wallet',
        description: '',
        color: '#1f8a4c',
      });
    });
    expect(await screen.findByText('Wallet Detail')).toBeInTheDocument();
  });
});

describe('WalletForm — edit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getWallet).mockResolvedValue({
      id: 'w1',
      name: 'Original',
      description: 'Old desc',
      color: '#1f8a4c',
      balance: '0',
      createdAt: '',
      updatedAt: '',
    });
    vi.mocked(updateWallet).mockResolvedValue({
      id: 'w1',
      name: '',
      description: '',
      color: '',
      balance: '0',
      createdAt: '',
      updatedAt: '',
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders the edit heading and pre-fills fields', async () => {
    renderEdit();
    expect(await screen.findByText('Edit Wallet')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old desc')).toBeInTheDocument();
  });

  it('updates the wallet and navigates to detail page', async () => {
    const user = userEvent.setup();
    renderEdit();
    await screen.findByText('Edit Wallet');

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(vi.mocked(updateWallet)).toHaveBeenCalledWith('w1', {
        name: 'Renamed',
        description: 'Old desc',
        color: '#1f8a4c',
      });
    });
    expect(await screen.findByText('Wallet Detail')).toBeInTheDocument();
  });
});
