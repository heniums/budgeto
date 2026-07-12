import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Profile } from './pages/Profile';
import { WalletList } from './pages/WalletList';
import { WalletForm } from './pages/WalletForm';
import { WalletDetail } from './pages/WalletDetail';

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
  {
    path: '/account/wallets',
    element: (
      <ProtectedRoute>
        <WalletList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/account/wallets/new',
    element: (
      <ProtectedRoute>
        <WalletForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/account/wallets/:id/edit',
    element: (
      <ProtectedRoute>
        <WalletForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/account/wallets/:id',
    element: (
      <ProtectedRoute>
        <WalletDetail />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
];
