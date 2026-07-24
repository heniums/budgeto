import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
}));

import { getMe } from '../api/auth';

function Probe(): JSX.Element {
  const { user, status, login, logout, refreshUser } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <button onClick={() => login(mockUser, 'token-1')}>login</button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => { void refreshUser(); }}>refresh</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    cleanup();
  });

  it('starts unauthenticated when getMe fails', async () => {
    vi.mocked(getMe).mockRejectedValue(new Error('unauthorized'));
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

  it('loads the current user via getMe on mount', async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
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

  it('clears the session when initial getMe fails', async () => {
    vi.mocked(getMe).mockRejectedValue(new Error('bad token'));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
  });

  it('login exposes the user', async () => {
    vi.mocked(getMe).mockRejectedValue(new Error('unauthorized'));
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
  });

  it('logout clears the session', async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
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
  });

  it('refreshUser sets unauthenticated when getMe rejects', async () => {
    vi.mocked(getMe).mockResolvedValueOnce(mockUser);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.co');

    vi.mocked(getMe).mockRejectedValueOnce(new Error('session expired'));
    await act(async () => {
      screen.getByText('refresh').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('does not warn when unmounted while getMe is pending', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let resolveGetMe!: (u: typeof mockUser) => void;
    vi.mocked(getMe).mockReturnValue(
      new Promise((resolve) => {
        resolveGetMe = resolve;
      }),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    cleanup();

    // Resolve after unmount to exercise the cleanup guard.
    await act(async () => {
      resolveGetMe(mockUser);
    });

    const stateUpdateWarnings = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes("Can't perform a React state update"),
    );
    expect(stateUpdateWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });
});
