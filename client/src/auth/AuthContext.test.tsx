import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };
const mockSession = { user: mockUser, accessToken: 'tok' };

vi.mock('../api/auth', () => ({
  refreshSession: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn(),
}));

import { refreshSession, getMe, updateSettings as updateSettingsApi } from '../api/auth';
import { UNAUTHORIZED_EVENT, ApiError } from '../api/client';

function Probe(): JSX.Element {
  const { user, status, login, logout, refreshUser, updateSettings } =
    useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="email">{user?.email ?? 'none'}</div>
      <div data-testid="name">{user?.name ?? 'none'}</div>
      <button
        type="button"
        onClick={() => login(mockSession)}
        data-testid="login-btn"
      >
        login
      </button>
      <button type="button" onClick={() => void logout()} data-testid="logout-btn">
        logout
      </button>
      <button type="button" onClick={() => void refreshUser()} data-testid="refresh-btn">
        refresh
      </button>
      <button
        type="button"
        onClick={() => void updateSettings({ theme: 'dark' })}
        data-testid="update-btn"
      >
        updateSettings
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('starts unauthenticated when refreshSession fails', async () => {
    vi.mocked(refreshSession).mockRejectedValue(new ApiError('Unauthorized', 401));
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

  it('loads the current user via refreshSession on mount', async () => {
    vi.mocked(refreshSession).mockResolvedValue(mockSession);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.co');
    expect(vi.mocked(refreshSession)).toHaveBeenCalled();
  });

  it('preserves the session on transient refreshSession failure (non-401)', async () => {
    vi.mocked(refreshSession).mockRejectedValue(new Error('network error'));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    // Status stays 'loading' since non-401 doesn't clear session
    await screen.findByTestId('status');
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
  });

  it('login exposes the user and persists the session', async () => {
    vi.mocked(refreshSession).mockRejectedValue(new Error('unauthorized'));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByTestId('status');
    act(() => {
      screen.getByTestId('login-btn').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.co');
  });
  it('logout clears the session', async () => {
    vi.mocked(refreshSession).mockResolvedValue(mockSession);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
  });
  it('refreshUser clears session when getMe returns 401', async () => {
    vi.mocked(refreshSession).mockResolvedValueOnce(mockSession);
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
      screen.getByTestId('refresh-btn').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('refreshUser preserves session on transient getMe failure (non-401)', async () => {
    vi.mocked(refreshSession).mockResolvedValueOnce(mockSession);
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
      screen.getByTestId('refresh-btn').click();
    });
    // Session is preserved — still authenticated
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
  });

  it('clears the session when budgeto:unauthorized is dispatched', async () => {
    vi.mocked(refreshSession).mockResolvedValue(mockSession);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );

    act(() => {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    });

    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
  });
  it('does not warn when unmounted while refreshSession is pending', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { promise, resolve: resolveRefresh } =
      Promise.withResolvers<typeof mockSession>();
    vi.mocked(refreshSession).mockReturnValue(promise);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    cleanup();

    // Resolve after unmount to exercise the cleanup guard.
    await act(async () => {
      resolveRefresh(mockSession);
    });

    const stateUpdateWarnings = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes("Can't perform a React state update"),
    );
    expect(stateUpdateWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('updateSettings calls the API and updates the user', async () => {
    vi.mocked(refreshSession).mockResolvedValue(mockSession);
    const updatedUser = {
      ...mockUser,
      name: 'Updated',
      settings: { theme: 'dark' },
    };
    vi.mocked(updateSettingsApi).mockResolvedValue(updatedUser);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );

    await act(async () => {
      screen.getByTestId('update-btn').click();
    });

    expect(updateSettingsApi).toHaveBeenCalledWith({ theme: 'dark' });
    expect(await screen.findByTestId('name')).toHaveTextContent('Updated');
  });
});
