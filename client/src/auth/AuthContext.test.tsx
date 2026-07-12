import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
}));

import { getMe } from '../api/auth';

function Probe(): JSX.Element {
  const { user, token, status, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => login('tok', mockUser)}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    window.localStorage.clear();
    cleanup();
  });

  it('starts unauthenticated when no token is stored', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('loads the current user via getMe when a token exists', async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
    window.localStorage.setItem('budgeto.token', 'saved-token');
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.co');
    expect(vi.mocked(getMe)).toHaveBeenCalled();
  });

  it('clears the session when getMe fails', async () => {
    vi.mocked(getMe).mockRejectedValue(new Error('bad token'));
    window.localStorage.setItem('budgeto.token', 'bad');
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
  });

  it('login persists the token and exposes the user', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByTestId('status');
    act(() => {
      screen.getByText('login').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    expect(screen.getByTestId('token')).toHaveTextContent('tok');
    expect(window.localStorage.getItem('budgeto.token')).toBe('tok');
  });

  it('logout clears the session and storage', async () => {
    window.localStorage.setItem('budgeto.token', 'saved-token');
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByTestId('status');
    act(() => {
      screen.getByText('logout').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(window.localStorage.getItem('budgeto.token')).toBeNull();
  });
});
