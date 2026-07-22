import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { SignIn } from './SignIn';

const mockUser = { id: 'u1', email: 'ada@example.com', name: 'Ada' };

import type * as AuthModule from '../api/auth';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return {
    ...actual,
    getMe: vi.fn(),
    login: vi.fn(),
  };
});

import { getMe, login } from '../api/auth';
import { ApiError } from '../api/client';

function LocationSpy(): JSX.Element {
  const location = useLocation();
  return <div>location: {location.pathname}</div>;
}

function renderSignIn(initialEntry: unknown = '/login'): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry as never]}>
        <Routes>
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<div>Sign up page</div>} />
          <Route path="/dashboard" element={<div>Dashboard home</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
          <Route path="*" element={<LocationSpy />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('SignIn form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(login).mockResolvedValue({ token: 'token-1', user: mockUser });
    window.localStorage.clear();
    cleanup();
  });

  it('shows inline validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderSignIn();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(vi.mocked(login)).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    const user = userEvent.setup();
    renderSignIn();
    await user.type(screen.getByLabelText(/email address/i), 'nope');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(
      await screen.findByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(vi.mocked(login)).not.toHaveBeenCalled();
  });

  it('surfaces invalid credentials as an inline error', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockRejectedValueOnce(
      new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS'),
    );
    renderSignIn();
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Dashboard home')).not.toBeInTheDocument();
    });
  });

  it('signs in and redirects to the dashboard on success', async () => {
    const user = userEvent.setup();
    renderSignIn();
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
    expect(vi.mocked(login)).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'supersecret',
    });
  });

  it('returns to the intended route after a guarded redirect', async () => {
    const user = userEvent.setup();
    renderSignIn({
      pathname: '/login',
      state: { from: { pathname: '/settings' } },
    });
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Settings')).toBeInTheDocument();
  });
});
