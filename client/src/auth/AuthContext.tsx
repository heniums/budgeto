import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getMe,
  logout as apiLogout,
  updateSettings as updateSettingsApi,
  refreshSession,
  type AuthUser,
  type UserSettings,
} from '../api/auth';
import { setAccessToken, UNAUTHORIZED_EVENT } from '../api/client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Persists the user and its access token after a successful login/register/refresh. */
  login: (session: { user: AuthUser; accessToken: string }) => void;
  /** Clears the session and revokes the access token. */
  logout: () => Promise<void>;
  /** Refreshes the current user from the server. */
  refreshUser: () => Promise<void>;
  /** Updates user settings on the server and locally. */
  updateSettings: (settings: UserSettings) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  // Set once an explicit login/register establishes the session. The
  // mount-time silent refresh must never override it, even if its response
  // lands afterwards.
  const explicitSessionRef = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Attempt silent re-auth on mount via the refresh cookie. If no refresh
  // cookie is present (first visit, expired refresh) the request 401s and the
  // session becomes unauthenticated. Transient (non-401) failures keep the
  // session in `loading` so a brief network blip doesn't bounce the user to
  // the sign-in page.
  useEffect(() => {
    let active = true;
    setStatus('loading');
    refreshSession()
      .then(({ user: fetched, accessToken }) => {
        if (!active || explicitSessionRef.current) return;
        setAccessToken(accessToken);
        setUser(fetched);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (!active || explicitSessionRef.current) return;
        if (
          error instanceof Error &&
          'status' in error &&
          error.status === 401
        ) {
          clearSession();
        }
        // Non-401: leave status as 'loading' so the user sees no false logout.
      });
    return () => {
      active = false;
    };
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [clearSession]);

  const login = useCallback(
    (session: { user: AuthUser; accessToken: string }) => {
      explicitSessionRef.current = true;
      setAccessToken(session.accessToken);
      setUser(session.user);
      setStatus('authenticated');
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore errors, clear local state anyway
    }
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await getMe();
      setUser(user);
    } catch (error) {
      // Only clear session on 401 — transient errors should not wipe a valid token
      if (error instanceof Error && 'status' in error && error.status === 401) {
        clearSession();
      }
    }
  }, [clearSession]);

  const updateSettings = useCallback(async (settings: UserSettings) => {
    const updated = await updateSettingsApi(settings);
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refreshUser, updateSettings }),
    [user, status, login, logout, refreshUser, updateSettings],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
