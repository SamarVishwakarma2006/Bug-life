import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
export function Loading() {
  return (
    <p
      role="status"
      className="flex items-center gap-2 py-12 text-sm text-muted-foreground"
    >
      <Loader2 size={17} className="animate-spin" />
      Loading…
    </p>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: Error | null;
  retry?: () => void;
}) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="my-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
    >
      <p>{error.message}</p>
      {retry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
