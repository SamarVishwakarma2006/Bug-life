import { Link } from 'react-router-dom';
import type { Activity } from '@/types/workspace';
import { statusLabel } from '@/utils/bugs';
export function ActivityList({
  items,
  projectKey,
}: {
  items: Activity[];
  projectKey?: string;
}) {
  if (!items.length)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        No activity yet. Report a bug to get started.
      </p>
    );
  return (
    <ol className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{item.actor.name}</span>
            <span className="text-muted-foreground">
              {statusLabel(item.type)}
            </span>
            {item.bug && (
              <Link
                className="text-primary hover:underline"
                to={`/bugs/${item.bug.id}`}
              >
                {projectKey ?? item.bug.project?.key}-{item.bug.number}
              </Link>
            )}
          </div>
          {typeof item.metadata.from === 'string' &&
            typeof item.metadata.to === 'string' &&
            ['MOVED', 'REOPENED'].includes(item.type) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {statusLabel(item.metadata.from)} →{' '}
                {statusLabel(item.metadata.to)}
              </p>
            )}
          <time
            className="mt-1 block text-xs text-muted-foreground"
            dateTime={item.createdAt}
          >
            {new Date(item.createdAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ol>
  );
}
