import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Field, Textarea } from './ui/form-controls';
import { ErrorState } from './WorkspaceState';
import type { Project } from '@/types/workspace';
const schema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(100),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z][A-Z0-9]{1,7}$/,
      'Use 2–8 letters or digits, starting with a letter.',
    ),
  description: z.string().trim().max(4000),
});
export function ProjectForm({
  project,
  onSuccess,
}: {
  project?: Project;
  onSuccess: () => void;
}) {
  const request = useApi();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      key: project?.key ?? '',
      description: project?.description ?? '',
    },
  });
  const save = useWorkspaceMutation(
    (input: z.infer<typeof schema>) =>
      request(
        project ? `/projects/${project.id}` : '/projects',
        project ? 'PUT' : 'POST',
        input,
      ),
    onSuccess,
  );
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((values) => save.mutate(values))}
    >
      <Field label="Project name" error={errors.name?.message}>
        <Input {...register('name')} placeholder="Sagar Drishti" autoFocus />
      </Field>
      <Field label="Project key" error={errors.key?.message}>
        <Input {...register('key')} placeholder="SD" />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <Textarea
          {...register('description')}
          placeholder="What are you building?"
        />
      </Field>
      <ErrorState error={save.error} />
      <Button type="submit" disabled={save.isPending}>
        {save.isPending
          ? 'Saving…'
          : project
            ? 'Save project'
            : 'Create project'}
      </Button>
    </form>
  );
}
