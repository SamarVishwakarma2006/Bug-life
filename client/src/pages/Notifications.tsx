import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading, ErrorState } from '@/components/WorkspaceState';
export interface Notification {
  id: string;
  message: string;
  bugId: string | null;
  read: boolean;
  createdAt: string;
}
export function NotificationBell() {
  const request = useApi();
  const query = useQuery({
    queryKey: ['workspace', 'notifications'],
    queryFn: () => request<Notification[]>('/notifications'),
  });
  const unread = query.data?.filter((item) => !item.read).length ?? 0;
  return (
    <Link
      to="/notifications"
      aria-label={`Notifications, ${unread} unread`}
      className="flex items-center gap-1 rounded-md p-2 text-muted-foreground hover:text-primary"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
          {unread}
        </span>
      )}
    </Link>
  );
}
export function Notifications() {
  const request = useApi();
  const query = useQuery({
    queryKey: ['workspace', 'notifications'],
    queryFn: () => request<Notification[]>('/notifications'),
  });
  const read = useWorkspaceMutation((id?: string) =>
    request(
      id ? `/notifications/${id}/read` : '/notifications/read-all',
      'PATCH',
    ),
  );
  return (
    <>
      <div className="mb-7 flex justify-between gap-3">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        <Button
          variant="outline"
          onClick={() => read.mutate(undefined)}
          disabled={read.isPending}
        >
          Mark all read
        </Button>
      </div>
      <ErrorState error={read.error} />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <Card className="divide-y">
          {!query.data.length && (
            <p className="p-12 text-center text-sm text-muted-foreground">
              You’re all caught up.
            </p>
          )}
          {query.data.map((item) => (
            <article
              key={item.id}
              className={`flex items-center gap-4 p-5 ${item.read ? '' : 'bg-accent/30'}`}
            >
              <div className="min-w-0 flex-1">
                {item.bugId ? (
                  <Link
                    className="break-words text-sm hover:text-primary"
                    to={`/bugs/${item.bugId}`}
                  >
                    {item.message}
                  </Link>
                ) : (
                  <p className="text-sm">{item.message}</p>
                )}
                <time className="mt-2 block text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </div>
              {!item.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={read.isPending}
                  onClick={() => read.mutate(item.id)}
                >
                  Mark read
                </Button>
              )}
            </article>
          ))}
        </Card>
      )}
    </>
  );
}
