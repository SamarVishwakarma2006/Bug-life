import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useWorkspace';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BugList } from '@/components/bugs/BugList';
import { ActivityList } from '@/components/ActivityList';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import type { Bug, Activity } from '@/types/workspace';
import type { User } from '@/types/auth';
import { levelTitle } from '@/utils/levels';
interface Data {
  user: User;
  assigned: Bug[];
  criticalCount: number;
  resolvedCount: number;
  recentActivity: Activity[];
}
export function Dashboard() {
  const request = useApi();
  const query = useQuery({
    queryKey: ['workspace', 'dashboard'],
    queryFn: () => request<Data>('/dashboard'),
  });
  if (query.isPending) return <Loading />;
  if (query.isError)
    return (
      <ErrorState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const { user, assigned, criticalCount, resolvedCount, recentActivity } =
    query.data;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
            Your workspace, at a glance
          </p>
          <h1 className="text-3xl font-semibold">
            Welcome back, {user.name.split(' ')[0]}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Level {user.level} · {levelTitle(user.level)} · {user.currentStreak}{' '}
            bug streak
          </p>
        </div>
        <Button asChild>
          <Link to="/projects">Open projects</Link>
        </Button>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Assigned to you', assigned.length],
          ['Open critical bugs', criticalCount],
          ['Resolved in your projects', resolvedCount],
          ['Your total XP', user.xp],
        ].map(([title, value]) => (
          <Card className="p-5" key={title}>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-4 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h2 className="mb-4 font-semibold">Your open bugs</h2>
          <BugList bugs={assigned} />
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          <Card>
            <ActivityList items={recentActivity} />
          </Card>
        </section>
      </div>
    </>
  );
}
