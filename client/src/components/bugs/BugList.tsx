import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { Bug } from '@/types/workspace';
import { statusLabel } from '@/utils/bugs';
import { Card } from '@/components/ui/card';
export function BugList({ bugs }: { bugs: Bug[] }) {
  if (!bugs.length)
    return (
      <Card className="p-12 text-center">
        <h2 className="font-semibold">No bugs to show</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Report a bug or adjust your filters.
        </p>
      </Card>
    );
  return (
    <Card className="divide-y overflow-hidden">
      {bugs.map((bug) => (
        <Link
          key={bug.id}
          to={`/bugs/${bug.id}`}
          className="block p-4 hover:bg-muted"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {bug.project.key}-{bug.number}
            </span>
            <span className="rounded border px-2 py-0.5 text-xs">
              {statusLabel(bug.status)}
            </span>
            <span
              className={`text-xs ${bug.priority === 'CRITICAL' ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}
            >
              {statusLabel(bug.priority)}
            </span>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare size={13} />
              {bug._count.comments}
            </span>
          </div>
          <h3 className="mt-2 break-words text-sm font-medium">{bug.title}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{bug.assignee?.name ?? 'Unassigned'}</span>
            {bug.labels.map((label) => (
              <span className="rounded bg-secondary px-2 py-0.5" key={label}>
                {label}
              </span>
            ))}
            {bug.dueDate && (
              <span className="ml-auto">Due {bug.dueDate.slice(0, 10)}</span>
            )}
          </div>
        </Link>
      ))}
    </Card>
  );
}
