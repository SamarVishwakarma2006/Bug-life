import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Member, Project } from '@/types/workspace';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Field, Select } from './ui/form-controls';
import { ErrorState } from './WorkspaceState';
const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  role: z.enum(['DEVELOPER', 'REVIEWER']),
});
export function ProjectTeam({
  project,
  isOwner,
}: {
  project: Project;
  isOwner: boolean;
}) {
  const request = useApi();
  const [removing, setRemoving] = useState<Member | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'DEVELOPER' },
  });
  const add = useWorkspaceMutation(
    (values: z.infer<typeof schema>) =>
      request(`/projects/${project.id}/members`, 'POST', values),
    () => reset(),
  );
  const change = useWorkspaceMutation(
    ({ id, role }: { id: string; role: string }) =>
      request(`/projects/${project.id}/members/${id}`, 'PATCH', { role }),
  );
  const remove = useWorkspaceMutation(
    (id: string) => request(`/projects/${project.id}/members/${id}`, 'DELETE'),
    () => setRemoving(null),
  );
  return (
    <div className="space-y-6">
      {isOwner && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Add a teammate</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Your teammate needs a registered BugLife account.
          </p>
          <form
            noValidate
            onSubmit={handleSubmit((values) => add.mutate(values))}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-56 flex-1">
              <Field label="Teammate email" error={errors.email?.message}>
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="teammate@example.com"
                />
              </Field>
            </div>
            <Field label="Role">
              <Select {...register('role')}>
                <option value="DEVELOPER">Developer</option>
                <option value="REVIEWER">Reviewer</option>
              </Select>
            </Field>
            <Button disabled={add.isPending} type="submit">
              {add.isPending ? 'Adding…' : 'Add member'}
            </Button>
          </form>
          <ErrorState error={add.error} />
        </Card>
      )}
      <ErrorState error={change.error} />
      <Card className="divide-y">
        {project.members.map((member) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center gap-4 p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
              {member.user.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium">
                {member.user.name}
              </p>
              <p className="break-all text-xs text-muted-foreground">
                {member.user.email}
              </p>
            </div>
            {isOwner && member.role !== 'OWNER' ? (
              <>
                <Select
                  aria-label={`Role for ${member.user.name}`}
                  value={member.role}
                  className="w-36"
                  disabled={change.isPending}
                  onChange={(event) =>
                    change.mutate({
                      id: member.userId,
                      role: event.target.value,
                    })
                  }
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="REVIEWER">Reviewer</option>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    remove.reset();
                    setRemoving(member);
                  }}
                >
                  Remove
                </Button>
              </>
            ) : (
              <span className="rounded border px-2 py-1 text-xs">
                {member.role}
              </span>
            )}
          </div>
        ))}
      </Card>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(null);
        }}
        title="Remove teammate?"
        description={`${removing?.user.name ?? 'This teammate'} will lose access to this project. Their assigned bugs will become unassigned; comments and activity are kept.`}
      >
        <ErrorState error={remove.error} />
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => setRemoving(null)}
          >
            Cancel
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={() => removing && remove.mutate(removing.userId)}
          >
            {remove.isPending ? 'Removing…' : 'Remove member'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
