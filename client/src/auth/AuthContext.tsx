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

  useEffect(() => {
    let active = true;
    setStatus('loading');
    getMe()
      .then((fetched) => {
        if (!active) return;
        setUser(fetched);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback((nextUser: AuthUser, token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await getMe();
      setUser(user);
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

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
