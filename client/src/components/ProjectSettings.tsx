import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types/workspace';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { ProjectForm } from './ProjectForm';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { ErrorState } from './WorkspaceState';
export function ProjectSettings({ project }: { project: Project }) {
  const request = useApi();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const remove = useWorkspaceMutation(
    () => request(`/projects/${project.id}`, 'DELETE'),
    () => navigate('/projects'),
  );
  return (
    <div className="max-w-xl space-y-6">
      <Card className="p-6">
        <h2 className="mb-5 font-semibold">Project details</h2>
        <ProjectForm
          key={project.id}
          project={project}
          onSuccess={() => setSaved(true)}
        />
        {saved && (
          <p className="mt-3 text-sm text-primary" role="status">
            Project saved.
          </p>
        )}
      </Card>
      <Card className="border-destructive/30 p-6">
        <h2 className="font-semibold">Delete project</h2>
        <p className="my-3 text-sm text-muted-foreground">
          Permanently delete this project and all of its bugs, comments, and
          activity.
        </p>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Delete project
        </Button>
      </Card>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!remove.isPending) setOpen(value);
        }}
        title="Delete this project?"
        description={`“${project.name}” and all its bugs will be permanently deleted. This cannot be undone.`}
      >
        <ErrorState error={remove.error} />
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={() => remove.mutate(undefined)}
          >
            {remove.isPending ? 'Deleting…' : 'Permanently delete project'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
