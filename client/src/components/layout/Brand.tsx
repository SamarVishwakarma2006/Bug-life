import { Bug } from 'lucide-react';
export function Brand() {
  return (
    <span className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Bug size={20} />
      </span>
      BugLife
      <span className="ml-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Beta
      </span>
    </span>
  );
}
