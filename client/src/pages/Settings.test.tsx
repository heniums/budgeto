import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Settings } from './Settings';

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
}));
import { getMe } from '../api/auth';

const mockUser = { id: 'u1', email: 'test@example.com', name: 'Test User' };

function renderSettings(initialEntry = '/settings'): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/settings" element={<Settings />}>
            <Route index element={<div data-testid="wallets-content">WalletList stub</div>} />
            <Route path="categories" element={<div data-testid="categories-content">Categories stub</div>} />
            <Route path="user" element={<div data-testid="user-content">Profile stub</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    cleanup();
  });

  it('renders tabs for Wallets, Categories, and User', async () => {
    renderSettings();
    expect(await screen.findByRole('tab', { name: /wallets/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /user/i })).toBeInTheDocument();
  });

  it('shows Wallets content by default', async () => {
    renderSettings();
    expect(await screen.findByTestId('wallets-content')).toBeInTheDocument();
  });

  it('switches to Categories content when Categories tab is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByTestId('wallets-content');
    await user.click(screen.getByRole('tab', { name: /categories/i }));

    expect(await screen.findByTestId('categories-content')).toBeInTheDocument();
  });

  it('switches to User content when User tab is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByTestId('wallets-content');
    await user.click(screen.getByRole('tab', { name: /user/i }));

    expect(await screen.findByTestId('user-content')).toBeInTheDocument();
  });
});
