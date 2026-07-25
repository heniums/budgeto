import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
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
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-card p-4 md:flex">
          <Skeleton className="mb-6 h-7 w-20" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-10 w-10" />
          </header>
          <main className="flex-1 p-4 md:p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          </main>
        </div>
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
