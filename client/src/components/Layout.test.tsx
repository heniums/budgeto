import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Layout } from '../components/Layout';

import type * as AuthModule from '../api/auth';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn() };
});
import { getMe } from '../api/auth';

function renderLayout(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue({
      id: 'u1',
      email: 'a@b.co',
      name: 'Ada',
    });
    window.localStorage.clear();
    cleanup();
  });

  it('renders only Home and Settings nav items', async () => {
    renderLayout();
    expect(
      await screen.findByRole('link', { name: /home/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /settings/i }),
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
});
