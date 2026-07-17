import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { WalletList } from './pages/WalletList';
import { Categories } from './pages/Categories';

export const routes: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/login', element: <SignIn /> },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Home /> },
      {
        path: '/settings',
        element: <Settings />,
        children: [
          { index: true, element: <WalletList /> },
          { path: 'categories', element: <Categories /> },
          { path: 'user', element: <Profile /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
