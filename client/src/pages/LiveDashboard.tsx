import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '@/hooks/useWorkspace';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BugList } from '@/components/bugs/BugList';
import { BugForm } from '@/components/bugs/BugForm';
import { Dialog } from '@/components/ui/dialog';
import { Field, Select } from '@/components/ui/form-controls';
import { ActivityList } from '@/components/ActivityList';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import type { Bug, Activity, Project } from '@/types/workspace';
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
  const [params, setParams] = useSearchParams();
  const [reportOpen, setReportOpen] = useState(params.get('report') === 'bug');
  function changeReportOpen(open: boolean) {
    setReportOpen(open);
    if (!open && params.has('report')) {
      const next = new URLSearchParams(params);
      next.delete('report');
      setParams(next, { replace: true });
    }
  }
  const [projectId, setProjectId] = useState('');
  const projects = useQuery({
    queryKey: ['workspace', 'projects'],
    queryFn: () => request<Project[]>('/projects'),
    enabled: reportOpen,
  });
  const selectedProject = projects.data?.find((project) => project.id === projectId)
    ?? (projects.data?.length === 1 ? projects.data[0] : undefined);
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
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setReportOpen(true)}>
            <Plus size={16} /> Report bug
          </Button>
          <Button asChild>
            <Link to="/projects">Open projects</Link>
          </Button>
        </div>
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
      <Dialog
        open={reportOpen}
        onOpenChange={changeReportOpen}
        title="Report a bug"
        description="Choose a project and describe the bug. New bugs start in Backlog."
      >
        {projects.isPending ? <Loading /> : projects.isError ? (
          <ErrorState error={projects.error} retry={() => { void projects.refetch(); }} />
        ) : !projects.data.length ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Create or join a project before reporting a bug.</p>
            <Button asChild><Link to="/projects">Open projects</Link></Button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <Field label="Project">
                <Select value={selectedProject?.id ?? ''} onChange={(event) => setProjectId(event.target.value)}>
                  <option value="">Choose a project</option>
                  {projects.data.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.key}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {selectedProject && (
              <BugForm key={selectedProject.id} projectId={selectedProject.id} members={selectedProject.members} onSuccess={() => changeReportOpen(false)} />
            )}
          </>
        )}
      </Dialog>
    </>
  );
}
