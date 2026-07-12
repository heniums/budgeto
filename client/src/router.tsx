import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Profile } from './pages/Profile';

/**
 * Application route table. Public pages are `/signup` and `/login`; the
 * `/account/*` area is guarded by `ProtectedRoute`.
 */
export const routes: RouteObject[] = [
  { path: '/signup', element: <SignUp /> },
  { path: '/login', element: <SignIn /> },
  {
    path: '/account/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
];
