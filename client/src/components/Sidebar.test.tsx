import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Sidebar } from '../components/Sidebar';

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

function renderSidebar(route = '/account/wallets'): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Sidebar />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue({ id: 'u1', email: 'a@b.co', name: 'Ada' });
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

  it('renders the wallets heading', async () => {
    renderSidebar();
    expect(await screen.findByText('Wallets')).toBeInTheDocument();
  });

  it('lists wallet names with balances', async () => {
    renderSidebar();
    expect(await screen.findByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
  });

  it('links to wallet management page', async () => {
    renderSidebar();
    expect(
      await screen.findByRole('link', { name: /manage/i }),
    ).toBeInTheDocument();
  });

  it('links to individual wallets', async () => {
    renderSidebar();
    const cashLink = await screen.findByRole('link', { name: /cash/i });
    expect(cashLink.getAttribute('href')).toBe('/account/wallets/w1');
  });
});
