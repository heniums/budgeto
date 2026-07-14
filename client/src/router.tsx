import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
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
      { path: '/', element: <Home /> },
      {
        path: '/settings',
        element: <Settings />,
        children: [
          { index: true, element: <WalletList /> },
          { path: 'wallets/new', element: <WalletForm /> },
          { path: 'wallets/:id', element: <WalletDetail /> },
          { path: 'wallets/:id/edit', element: <WalletForm /> },
          { path: 'categories', element: <Categories /> },
          { path: 'categories/new', element: <CategoryForm /> },
          { path: 'categories/:id/edit', element: <CategoryForm /> },
          { path: 'user', element: <Profile /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
