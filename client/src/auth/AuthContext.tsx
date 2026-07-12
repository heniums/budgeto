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

const TOKEN_KEY = 'budgeto.token';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  /** Persists the token and the current user. */
  login: (token: string, user: AuthUser) => void;
  /** Clears the session and returns to the unauthenticated state. */
  logout: () => void;
  /** Refreshes the current user from the server. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage failures (e.g. private mode).
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;
    if (!token) {
      setStatus('unauthenticated');
      setUser(null);
      return;
    }
    setStatus('loading');
    getMe(token)
      .then((fetched) => {
        if (!active) return;
        setUser(fetched);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        writeToken(null);
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback((nextToken: string, nextUser: AuthUser) => {
    writeToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const user = await getMe(token);
      setUser(user);
    } catch {
      writeToken(null);
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, logout, refreshUser }),
    [user, token, status, login, logout, refreshUser],
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
