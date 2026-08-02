import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getMe,
  logout as apiLogout,
  updateSettings as updateSettingsApi,
  type AuthUser,
  type UserSettings,
} from '../api/auth';
import { UNAUTHORIZED_EVENT } from '../api/client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Persists the current user. */
  login: (user: AuthUser) => void;
  /** Clears the session and returns to the unauthenticated state. */
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

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    getMe({ skipRefresh: true })
      .then((fetched) => {
        if (!active) return;
        setUser(fetched);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (!active) return;
        if (error?.status === 401) {
          clearSession();
        }
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

  const login = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

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
      if ((error as { status?: number })?.status === 401) {
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
