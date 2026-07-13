import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Dashboard } from './Dashboard';

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
    getWallets: vi.fn(),
  };
});

import { getMe } from '../api/auth';
import { getWallets } from '../api/wallets';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

function renderDashboard(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account/wallets" element={<div>Wallets</div>} />
          <Route
            path="/account/wallets/:id"
            element={<div>Wallet Detail</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(getWallets).mockResolvedValue({
      wallets: [
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
      ],
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders the page heading', async () => {
    renderDashboard();
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('shows total balance across all wallets', async () => {
    renderDashboard();
    expect(await screen.findByText('150.00')).toBeInTheDocument();
  });

  it('renders wallet summary cards', async () => {
    renderDashboard();
    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
  });

  it('navigates to wallet detail on card click', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('Cash');
    await user.click(screen.getByText('Cash'));
    expect(screen.getByText('Wallet Detail')).toBeInTheDocument();
  });

  it('links to wallet management page', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('Dashboard');
    await user.click(screen.getByRole('link', { name: /manage wallets/i }));
    expect(screen.getByText('Wallets')).toBeInTheDocument();
  });
});
