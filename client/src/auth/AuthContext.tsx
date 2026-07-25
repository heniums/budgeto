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
  type AuthUser,
} from '../api/auth';
import { UNAUTHORIZED_EVENT } from '../api/client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

const AUTH_TOKEN_KEY = 'budgeto:token';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Persists the current user and token. */
  login: (user: AuthUser, token: string) => void;
  /** Clears the session and returns to the unauthenticated state. */
  logout: () => void;
  /** Refreshes the current user from the server. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    setStatus('loading');
    getMe()
      .then((fetched) => {
        if (!active) return;
        setUser(fetched);
        setStatus('authenticated');
      })
      .catch((error) => {
        console.log('error:', error);
        if (!active) return;
        // Only clear session on 401 — transient errors (network, CORS, 500)
        // should not wipe a valid token
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

  const login = useCallback((nextUser: AuthUser, token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
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

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refreshUser }),
    [user, status, login, logout, refreshUser],
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
