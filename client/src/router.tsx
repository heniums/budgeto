import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { WalletList } from './pages/WalletList';
import { WalletForm } from './pages/WalletForm';
import { WalletDetail } from './pages/WalletDetail';
import { Categories } from './pages/Categories';
import { CategoryForm } from './pages/CategoryForm';

export const routes: RouteObject[] = [
  { path: '/signup', element: <SignUp /> },
  { path: '/login', element: <SignIn /> },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/account/profile', element: <Profile /> },
      { path: '/account/wallets', element: <WalletList /> },
      { path: '/account/wallets/new', element: <WalletForm /> },
      { path: '/account/wallets/:id/edit', element: <WalletForm /> },
      { path: '/account/wallets/:id', element: <WalletDetail /> },
      { path: '/account/categories', element: <Categories /> },
      { path: '/account/categories/new', element: <CategoryForm /> },
      { path: '/account/categories/:id/edit', element: <CategoryForm /> },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
];
