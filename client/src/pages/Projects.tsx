import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import { useApi } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from '@/types/workspace';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/ProjectForm';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import { statusLabel } from '@/utils/bugs';
export function Projects() {
  const request = useApi();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['workspace', 'projects'],
    queryFn: () => request<Project[]>('/projects'),
  });
  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A shared home for your team’s bugs.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          New project
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : !query.data.length ? (
        <Card className="p-12 text-center">
          <FolderKanban size={28} className="mx-auto mb-4 text-primary" />
          <h2 className="text-lg font-semibold">
            Your first project starts here
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a project, add teammates, and report your first bug.
          </p>
          <Button className="mt-6" onClick={() => setOpen(true)}>
            Create project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="rounded-lg"
            >
              <Card className="h-full p-6 hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                    {project.key}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {statusLabel(
                      project.members.find(
                        (member) => member.userId === user?.id,
                      )?.role ?? '',
                    )}
                  </span>
                </div>
                <h2 className="mt-4 break-words text-lg font-semibold">
                  {project.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {project.description || 'No description yet.'}
                </p>
                <p className="mt-5 text-xs text-muted-foreground">
                  {project._count.bugs} bugs · {project.members.length} members
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Create project"
        description="You’ll be the owner and can add teammates after creating it."
      >
        <ProjectForm onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
