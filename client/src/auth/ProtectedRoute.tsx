import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Wraps a route element so it is only reachable by authenticated users. While
 * the session is loading it renders a placeholder; unauthenticated visitors are
 * redirected to `/login`, remembering where they came from so login can return
 * them to the original destination.
 */
export function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return <div>Loading…</div>;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
