import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
}));

import { getMe } from '../api/auth';
import { UNAUTHORIZED_EVENT, ApiError } from '../api/client';

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
    window.localStorage.setItem('budgeto:token', 'stored-token');
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
  it('clears the session when initial getMe returns 401', async () => {
    window.localStorage.setItem('budgeto:token', 'stale-token');
    vi.mocked(getMe).mockRejectedValue(new ApiError('Unauthorized', 401));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(window.localStorage.getItem('budgeto:token')).toBeNull();
  });
  it('preserves the session on transient getMe failure (non-401)', async () => {
    window.localStorage.setItem('budgeto:token', 'stored-token');
    vi.mocked(getMe).mockRejectedValue(new Error('network error'));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    // Wait for initial render
    await screen.findByTestId('status');
    // Token should still be in localStorage
    expect(window.localStorage.getItem('budgeto:token')).toBe('stored-token');
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
    window.localStorage.setItem('budgeto:token', 'stored-token');
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
  it('refreshUser clears session when getMe returns 401', async () => {
    window.localStorage.setItem('budgeto:token', 'stored-token');
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

    vi.mocked(getMe).mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    await act(async () => {
      screen.getByText('refresh').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('refreshUser preserves session on transient getMe failure (non-401)', async () => {
    window.localStorage.setItem('budgeto:token', 'stored-token');
    vi.mocked(getMe).mockResolvedValueOnce(mockUser);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );

    vi.mocked(getMe).mockRejectedValueOnce(new Error('network error'));
    await act(async () => {
      screen.getByText('refresh').click();
    });
    // Token should still be in localStorage
    expect(window.localStorage.getItem('budgeto:token')).toBe('stored-token');
  });

  it('clears the session when budgeto:unauthorized is dispatched', async () => {
    window.localStorage.setItem('budgeto:token', 'stale-token');
    vi.mocked(getMe).mockResolvedValue(mockUser);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    expect(window.localStorage.getItem('budgeto:token')).toBe('stale-token');

    act(() => {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    });

    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(window.localStorage.getItem('budgeto:token')).toBeNull();
  });
  it('does not warn when unmounted while getMe is pending', async () => {
    window.localStorage.setItem('budgeto:token', 'stored-token');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { promise, resolve: resolveGetMe } = Promise.withResolvers<typeof mockUser>();
    vi.mocked(getMe).mockReturnValue(promise);

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
