import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-controls';
import { ErrorState } from '@/components/WorkspaceState';
const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  password: z
    .string()
    .min(8)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      'Use at most 72 UTF-8 bytes.',
    ),
});
export function Settings() {
  const request = useApi();
  const { user, logout } = useAuth();
  const cache = useQueryClient();
  const [saved, setSaved] = useState(false);
  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email },
  });
  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });
  const save = useWorkspaceMutation(
    (input: z.infer<typeof profileSchema>) =>
      request('/auth/me', 'PATCH', input),
    () => {
      setSaved(true);
      void cache.invalidateQueries({ queryKey: ['auth'] });
    },
  );
  const change = useWorkspaceMutation(
    (input: z.infer<typeof passwordSchema>) =>
      request('/auth/password', 'PATCH', input),
    logout,
  );
  return (
    <>
      <h1 className="mb-7 text-3xl font-semibold">Settings</h1>
      <div className="max-w-xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Your profile</h2>
          <form
            className="space-y-4"
            noValidate
            onSubmit={profile.handleSubmit((values) => save.mutate(values))}
          >
            <Field label="Name" error={profile.formState.errors.name?.message}>
              <Input {...profile.register('name')} autoComplete="name" />
            </Field>
            <Field
              label="Email"
              error={profile.formState.errors.email?.message}
            >
              <Input
                type="email"
                {...profile.register('email')}
                autoComplete="email"
              />
            </Field>
            <ErrorState error={save.error} />
            <Button type="submit" disabled={save.isPending}>
              Save profile
            </Button>
            {saved && (
              <p role="status" className="text-sm text-primary">
                Profile saved.
              </p>
            )}
          </form>
        </Card>
        <Card className="p-6">
          <h2 className="mb-2 font-semibold">Change password</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Changing your password signs you out of every session.
          </p>
          <form
            noValidate
            className="space-y-4"
            onSubmit={password.handleSubmit((values) => change.mutate(values))}
          >
            <Field
              label="Current password"
              error={password.formState.errors.currentPassword?.message}
            >
              <Input
                type="password"
                {...password.register('currentPassword')}
                autoComplete="current-password"
              />
            </Field>
            <Field
              label="New password"
              error={password.formState.errors.password?.message}
            >
              <Input
                type="password"
                {...password.register('password')}
                autoComplete="new-password"
              />
            </Field>
            <ErrorState error={change.error} />
            <Button type="submit" disabled={change.isPending}>
              Change password
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
