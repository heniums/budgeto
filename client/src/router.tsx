import { Navigate, type RouteObject } from 'react-router-dom';
import { GuestRoute } from './auth/GuestRoute';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { Transactions } from './pages/Transactions';
import { Profile } from './pages/Profile';
import { WalletList } from './pages/WalletList';
import { Categories } from './pages/Categories';
import { Budgets } from './pages/Budgets';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <GuestRoute>
        <Landing />
      </GuestRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestRoute>
        <SignUp />
      </GuestRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <SignIn />
      </GuestRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/home', element: <Home /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/budgets', element: <Budgets /> },
      { path: '/wallets', element: <WalletList /> },
      { path: '/categories', element: <Categories /> },
      { path: '/profile', element: <Profile /> },
      { path: '/dashboard', element: <Navigate to="/home" replace /> },
      { path: '/settings', element: <Navigate to="/wallets" replace /> },
      {
        path: '/settings/categories',
        element: <Navigate to="/categories" replace />,
      },
      { path: '/settings/user', element: <Navigate to="/profile" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
