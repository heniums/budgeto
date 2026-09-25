import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Layout } from '../components/Layout';

import type * as AuthModule from '../api/auth';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, refreshSession: vi.fn() };
});
import { refreshSession } from '../api/auth';

function renderLayout(): void {
  render(
    <AuthProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>
      </ThemeProvider>
    </AuthProvider>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockResolvedValue({
      user: { id: 'u1', email: 'a@b.co', name: 'Ada' },
      accessToken: 'tok',
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders all top-level nav items', async () => {
    renderLayout();
    expect(
      await screen.findByRole('link', { name: /^home$/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /transactions/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /budgets/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /wallets/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /categories/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /profile/i }),
    ).toBeInTheDocument();
  });

  it('offers a mobile menu button', async () => {
    renderLayout();
    expect(
      await screen.findByRole('button', { name: /open menu/i }),
    ).toBeInTheDocument();
  });

  it('shows the log out control', async () => {
    renderLayout();
    expect(
      await screen.findByRole('button', { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it('hides the desktop sidebar on mobile', async () => {
    renderLayout();
    expect(await screen.findByRole('complementary')).toHaveClass('hidden');
  });
});
