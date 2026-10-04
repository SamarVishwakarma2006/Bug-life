import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { ErrorState } from '@/components/WorkspaceState';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { bugTypes, priorities, statusLabel } from '@/utils/bugs';
import type { Bug, Member } from '@/types/workspace';
const schema = z.object({
  title: z.string().trim().min(3, 'Enter at least 3 characters.').max(200),
  description: z.string().trim().max(10000),
  priority: z.enum(priorities),
  type: z.enum(bugTypes),
  labels: z.string().refine((text) => {
    const labels = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return labels.length <= 10 && labels.every((label) => label.length <= 32);
  }, 'Use at most 10 labels, up to 32 characters each.'),
  dueDate: z
    .string()
    .refine(
      (value) =>
        !value ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value))),
      'Enter a valid date.',
    ),
  assigneeId: z.string(),
});
type Values = z.infer<typeof schema>;
export function BugForm({
  projectId,
  members,
  bug,
  onSuccess,
}: {
  projectId: string;
  members: Member[];
  bug?: Bug;
  onSuccess: () => void;
}) {
  const request = useApi();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: bug?.title ?? '',
      description: bug?.description ?? '',
      priority: bug?.priority ?? 'MEDIUM',
      type: (bug?.type as Values['type']) ?? 'OTHER',
      labels: bug?.labels.join(', ') ?? '',
      dueDate: bug?.dueDate?.slice(0, 10) ?? '',
      assigneeId: bug?.assigneeId ?? '',
    },
  });
  const save = useWorkspaceMutation(async (values: Values) => {
    const { assigneeId, ...fields } = values;
    const body = {
      ...fields,
      labels: fields.labels
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      dueDate: fields.dueDate ? `${fields.dueDate}T00:00:00.000Z` : null,
      ...(!bug ? { assigneeId: assigneeId || null } : {}),
    };
    return request(
      bug ? `/bugs/${bug.id}` : `/projects/${projectId}/bugs`,
      bug ? 'PUT' : 'POST',
      body,
    );
  }, onSuccess);
  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => save.mutate(values))}
      noValidate
    >
      <Field label="Title" error={errors.title?.message}>
        <Input
          {...register('title')}
          placeholder="What needs fixing?"
          autoFocus
        />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <Textarea
          {...register('description')}
          placeholder="Steps to reproduce, expected behavior, and what happened instead…"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Priority">
          <Select {...register('priority')}>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select {...register('type')}>
            {bugTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {!bug && (
        <Field label="Assignee">
          <Select {...register('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map(({ user }) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Labels (comma separated)" error={errors.labels?.message}>
        <Input {...register('labels')} placeholder="checkout, regression" />
      </Field>
      <Field label="Due date" error={errors.dueDate?.message}>
        <Input type="date" {...register('dueDate')} />
      </Field>
      <ErrorState error={save.error} />
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : bug ? 'Save bug' : 'Report bug'}
      </Button>
    </form>
  );
}
