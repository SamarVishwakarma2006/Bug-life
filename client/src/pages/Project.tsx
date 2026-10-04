import { useState, lazy, Suspense } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { Activity, Bug, Project as ProjectType } from '@/types/workspace';
import { useApi } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field, Select } from '@/components/ui/form-controls';
import { BugForm } from '@/components/bugs/BugForm';
import { BugList } from '@/components/bugs/BugList';
import { ProjectTeam } from '@/components/ProjectTeam';
import { ProjectSettings } from '@/components/ProjectSettings';
import { ActivityList } from '@/components/ActivityList';
import { statuses, priorities, statusLabel } from '@/utils/bugs';
import { cn } from '@/utils/cn';
const Board = lazy(() => import('@/components/board/Board').then((module) => ({ default: module.Board })));
const Analytics = lazy(() => import('@/components/charts/Analytics').then((module) => ({ default: module.Analytics })));

export function Project() {
  const { id = '' } = useParams();
  const request = useApi();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    label: '',
    q: '',
  });
  const filterQuery = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  ).toString();
  const project = useQuery({
    queryKey: ['workspace', 'project', id],
    queryFn: () => request<ProjectType>(`/projects/${id}`),
  });
  const bugs = useQuery({
    queryKey: ['workspace', 'bugs', id, filterQuery],
    queryFn: () => request<Bug[]>(`/projects/${id}/bugs?${filterQuery}`),
    enabled: !!project.data && tab === 'bugs',
  });
  const activity = useQuery({
    queryKey: ['workspace', 'activity', id],
    queryFn: () => request<Activity[]>(`/projects/${id}/activity`),
    enabled: !!project.data && tab === 'activity',
  });
  if (project.isPending) return <Loading />;
  if (project.isError)
    return (
      <ErrorState
        error={project.error}
        retry={() => {
          void project.refetch();
        }}
      />
    );
  const value = project.data;
  const owner = value.ownerId === user?.id;
  const role = value.members.find((member) => member.userId === user?.id)?.role;
  const tabs = [
    'overview',
    'board',
    'bugs',
    'analytics',
    'team',
    'activity',
    ...(owner ? ['settings'] : []),
  ];
  return (
    <>
      <Link
        className="text-xs text-muted-foreground hover:text-primary"
        to="/projects"
      >
        ← All projects
      </Link>
      <div className="mb-7 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="rounded bg-accent px-2 py-1 font-mono text-accent-foreground">
              {value.key}
            </span>
            <span className="text-muted-foreground">{role}</span>
          </div>
          <h1 className="break-words text-3xl font-semibold tracking-tight">
            {value.name}
          </h1>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          Report bug
        </Button>
      </div>
      <nav
        aria-label="Project tabs"
        className="mb-7 flex gap-1 overflow-x-auto border-b"
      >
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setParams({ tab: item })}
            aria-current={tab === item ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 pb-3 pt-2 text-sm',
              tab === item
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {statusLabel(item)}
          </button>
        ))}
      </nav>
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 font-semibold">About this project</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
              {value.description || 'No description yet.'}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              Created {new Date(value.createdAt).toLocaleDateString()}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Ready to get to work?</h2>
            <p className="my-4 text-sm text-muted-foreground">
              {value._count.bugs} bugs · {value.members.length} teammates
            </p>
            <Button
              variant="outline"
              onClick={() => setParams({ tab: 'bugs' })}
            >
              View bugs
            </Button>
          </Card>
        </div>
      )}
      {tab === 'bugs' && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Search bugs">
              <Input
                value={filters.q}
                onChange={(event) =>
                  setFilters({ ...filters, q: event.target.value })
                }
                placeholder="Title, description, or number"
                maxLength={200}
              />
            </Field>
            <Field label="Status">
              <Select
                value={filters.status}
                onChange={(event) =>
                  setFilters({ ...filters, status: event.target.value })
                }
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={filters.priority}
                onChange={(event) =>
                  setFilters({ ...filters, priority: event.target.value })
                }
              >
                <option value="">All priorities</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {statusLabel(priority)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assignee">
              <Select
                value={filters.assignee}
                onChange={(event) =>
                  setFilters({ ...filters, assignee: event.target.value })
                }
              >
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {value.members.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Label">
              <Input
                value={filters.label}
                maxLength={32}
                placeholder="Exact label"
                onChange={(event) =>
                  setFilters({ ...filters, label: event.target.value })
                }
              />
            </Field>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() =>
                  setFilters({
                    status: '',
                    priority: '',
                    assignee: '',
                    label: '',
                    q: '',
                  })
                }
              >
                Clear filters
              </Button>
            </div>
          </div>
          {bugs.isPending ? (
            <Loading />
          ) : bugs.isError ? (
            <ErrorState
              error={bugs.error}
              retry={() => {
                void bugs.refetch();
              }}
            />
          ) : (
            <BugList bugs={bugs.data} />
          )}
        </>
      )}
      {tab === 'team' && <ProjectTeam project={value} isOwner={owner} />}
      {tab === 'settings' &&
        (owner ? (
          <ProjectSettings project={value} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Only the project owner can manage settings.
          </p>
        ))}
      {tab === 'activity' &&
        (activity.isPending ? (
          <Loading />
        ) : activity.isError ? (
          <ErrorState
            error={activity.error}
            retry={() => {
              void activity.refetch();
            }}
          />
        ) : (
          <Card>
            <ActivityList items={activity.data} projectKey={value.key} />
          </Card>
        ))}
      {tab === 'board' && <Suspense fallback={<Loading />}><Board projectId={id} /></Suspense>}
      {tab === 'analytics' && <Suspense fallback={<Loading />}><Analytics projectId={id} /></Suspense>}
      {![
        'overview',
        'bugs',
        'team',
        'settings',
        'activity',
        'board',
        'analytics',
      ].includes(tab) && (
        <p className="text-sm text-muted-foreground">
          This project tab does not exist.
        </p>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Report a bug"
        description={`Create a new bug in ${value.name}. New bugs start in Backlog.`}
      >
        <BugForm
          projectId={id}
          members={value.members}
          onSuccess={() => {
            setOpen(false);
            setParams({ tab: 'bugs' });
          }}
        />
      </Dialog>
    </>
  );
}
