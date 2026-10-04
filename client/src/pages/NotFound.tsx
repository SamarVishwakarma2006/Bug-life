import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export function NotFound() {
  return (
    <main className="flex min-h-80 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page doesn’t exist.</p>
      <Button asChild>
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </main>
  );
}
