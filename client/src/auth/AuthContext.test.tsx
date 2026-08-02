import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn(),
}));

import { getMe, updateSettings as updateSettingsApi } from '../api/auth';
import { UNAUTHORIZED_EVENT, ApiError } from '../api/client';

function Probe(): JSX.Element {
  const { user, status, login, logout, refreshUser, updateSettings } =
    useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="name">{user?.name ?? 'noname'}</span>
      <button onClick={() => login(mockUser)}>login</button>
      <button
        onClick={() => {
          void logout();
        }}
      >
        logout
      </button>
      <button
        onClick={() => {
          void refreshUser();
        }}
      >
        refresh
      </button>
      <button
        onClick={() => {
          void updateSettings({ theme: 'dark' });
        }}
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

  it('starts unauthenticated when getMe fails with 401', async () => {
    vi.mocked(getMe).mockRejectedValue(new ApiError('Unauthorized', 401));
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
    expect(vi.mocked(getMe)).toHaveBeenCalledWith({ skipRefresh: true });
  });
  it('clears the session when initial getMe returns 401', async () => {
    vi.mocked(getMe).mockRejectedValue(new ApiError('Unauthorized', 401));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
  });
  it('preserves the session on transient getMe failure (non-401)', async () => {
    vi.mocked(getMe).mockRejectedValue(new Error('network error'));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    // Wait for initial render — status stays 'loading' since non-401 doesn't clear session
    await screen.findByTestId('status');
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
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
    await act(async () => {
      screen.getByText('logout').click();
    });
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'unauthenticated',
    );
  });
  it('refreshUser clears session when getMe returns 401', async () => {
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
    // Session is preserved — still authenticated
    expect(await screen.findByTestId('status')).toHaveTextContent(
      'authenticated',
    );
  });

  it('clears the session when budgeto:unauthorized is dispatched', async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
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
  it('does not warn when unmounted while getMe is pending', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { promise, resolve: resolveGetMe } =
      Promise.withResolvers<typeof mockUser>();
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

  it('updateSettings calls the API and updates the user', async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
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
      screen.getByText('updateSettings').click();
    });

    expect(updateSettingsApi).toHaveBeenCalledWith({ theme: 'dark' });
    expect(await screen.findByTestId('name')).toHaveTextContent('Updated');
  });
});
