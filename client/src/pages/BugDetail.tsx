import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Bug, Project, Status } from '@/types/workspace';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select, Field } from '@/components/ui/form-controls';
import { BugForm } from '@/components/bugs/BugForm';
import { Comments } from '@/components/bugs/Comments';
import { Attachments } from '@/components/bugs/Attachments';
import { ActivityList } from '@/components/ActivityList';
import { statusLabel, transitions } from '@/utils/bugs';
export function BugDetail() {
  const { id = '' } = useParams();
  const request = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const query = useQuery({
    queryKey: ['workspace', 'bug', id],
    queryFn: () => request<Bug>(`/bugs/${id}`),
  });
  const project = useQuery({
    queryKey: ['workspace', 'project', query.data?.projectId],
    queryFn: () => request<Project>(`/projects/${query.data?.projectId}`),
    enabled: !!query.data,
  });
  const move = useWorkspaceMutation((status: Status) =>
    request(`/bugs/${id}/status`, 'PATCH', {
      status,
      position: query.data?.position ?? 0,
    }),
  );
  const assign = useWorkspaceMutation((assigneeId: string) =>
    request(`/bugs/${id}/assign`, 'PATCH', { assigneeId: assigneeId || null }),
  );
  const remove = useWorkspaceMutation(
    () => request(`/bugs/${id}`, 'DELETE'),
    () => navigate(`/projects/${query.data?.projectId}?tab=bugs`),
  );
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
  const bug = query.data;
  const role = project.data?.members.find(
    (member) => member.userId === user?.id,
  )?.role;
  const owner = role === 'OWNER';
  return (
    <>
      <Link
        to={`/projects/${bug.projectId}?tab=bugs`}
        className="text-xs text-muted-foreground hover:text-primary"
      >
        ← {bug.project.name} / Bugs
      </Link>
      <div className="my-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-2 font-mono text-sm text-primary">
            {bug.project.key}-{bug.number}
          </p>
          <h1 className="break-words text-2xl font-semibold tracking-tight">
            {bug.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit bug
          </Button>
          {owner && (
            <Button variant="ghost" onClick={() => setDeleting(true)}>
              Delete bug
            </Button>
          )}
        </div>
      </div>
      <ErrorState error={move.error} />
      <ErrorState error={assign.error} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">Description</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
              {bug.description || 'No description provided.'}
            </p>
            {bug.labels.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {bug.labels.map((label) => (
                  <span
                    className="rounded bg-secondary px-2 py-1 text-xs"
                    key={label}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </Card>
          <Attachments bugId={id} />
          <Comments bugId={id} isOwner={owner} />
          <Card>
            <h2 className="border-b p-5 font-semibold">Activity</h2>
            <ActivityList items={bug.activities ?? []} />
          </Card>
        </div>
        <div>
          <Card className="space-y-6 p-5">
            <div>
              <h2 className="text-sm font-medium">Status</h2>
              <p className="mt-2 inline-block rounded bg-accent px-2 py-1 text-sm text-accent-foreground">
                {statusLabel(bug.status)}
              </p>
              <div className="mt-4 space-y-2">
                {transitions[bug.status].map((status) => (
                  <Button
                    key={status}
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                    disabled={
                      move.isPending ||
                      (role === 'DEVELOPER' &&
                        ['RESOLVED', 'REOPENED'].includes(status))
                    }
                    onClick={() => move.mutate(status)}
                  >
                    Move to {statusLabel(status)}
                  </Button>
                ))}
              </div>
              {role === 'DEVELOPER' &&
                ['REVIEW', 'RESOLVED'].includes(bug.status) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    An owner or reviewer must approve or reopen this bug.
                  </p>
                )}
            </div>
            <Field label="Assignee">
              <Select
                value={bug.assigneeId ?? ''}
                disabled={assign.isPending}
                onChange={(event) => assign.mutate(event.target.value)}
              >
                <option value="">Unassigned</option>
                {project.data?.members.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </Field>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Priority</dt>
                <dd className="mt-1">{statusLabel(bug.priority)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="mt-1">{bug.type}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reported by</dt>
                <dd className="mt-1">{bug.reporter.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Due date</dt>
                <dd className="mt-1">
                  {bug.dueDate?.slice(0, 10) ?? 'No due date'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  {new Date(bug.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
      <Dialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit bug"
        description="Update the report. Use the sidebar to change status or assignee."
      >
        <BugForm
          bug={bug}
          projectId={bug.projectId}
          members={project.data?.members ?? []}
          onSuccess={() => setEditing(false)}
        />
      </Dialog>
      <Dialog
        open={deleting}
        onOpenChange={(open) => {
          if (!remove.isPending) setDeleting(open);
        }}
        title="Delete bug?"
        description={`${bug.project.key}-${bug.number} and its comments will be permanently deleted. Bug numbers are never reused.`}
      >
        <ErrorState error={remove.error} />
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => setDeleting(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={() => remove.mutate(undefined)}
          >
            {remove.isPending ? 'Deleting…' : 'Permanently delete bug'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
