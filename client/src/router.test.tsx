import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  RouterProvider,
  createMemoryRouter,
} from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { routes } from './router';

const mockUser = { id: 'u1', email: 'a@b.co', name: 'Ada' };

vi.mock('./api/auth', () => ({
  getMe: vi.fn(),
}));
import { getMe } from './api/auth';

function LoginSpy(): JSX.Element {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from;
  return <div>login spy: {from?.pathname ?? 'none'}</div>;
}

describe('router guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockRejectedValue(new Error('unauthorized'));
    window.localStorage.clear();
    cleanup();
  });

  it('redirects an unauthenticated user from /account/profile to /login', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/account/profile']}>
          <Routes>
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <div>secret</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Sign in</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(await screen.findByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('captures the intended destination for post-login redirect', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/account/profile']}>
          <Routes>
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <div>secret</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginSpy />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(
      await screen.findByText('login spy: /account/profile'),
    ).toBeInTheDocument();
  });

  it('lets an authenticated user reach /account/profile', async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/account/profile']}>
          <Routes>
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <div>secret</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Sign in</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(await screen.findByText('secret')).toBeInTheDocument();
  });

  it('redirects the index route to /login when unauthenticated', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );
    expect(await screen.findByText('Sign in')).toBeInTheDocument();
  });
});
