import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
export function ProtectedRoute() {
  const { user, loading, error, retry, logout } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <main
        className="flex min-h-screen items-center justify-center gap-3"
        role="status"
      >
        <Loader2 className="animate-spin" size={20} />
        Loading your workspace…
      </main>
    );
  if (error)
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6">
        <p role="alert">{error.message}</p>
        <div className="flex gap-2">
          <Button onClick={retry}>Try again</Button>
          <Button variant="outline" onClick={logout}>
            Back to sign in
          </Button>
        </div>
      </main>
    );
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
