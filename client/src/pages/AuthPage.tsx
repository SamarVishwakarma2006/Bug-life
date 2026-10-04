import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { AuthResponse } from '@/types/auth';

const password = z
  .string()
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Use at most 72 UTF-8 bytes.',
  );
const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').pipe(password),
});
const registerSchema = formSchema.extend({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(80),
  password: z.string().min(8, 'Use at least 8 characters.').pipe(password),
});
type Values = z.infer<typeof formSchema>;

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const { user, authenticate } = useAuth();
  const location = useLocation();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(isRegister ? registerSchema : formSchema),
  });
  const from = (location.state as { from?: unknown } | null)?.from;
  const destination =
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !['/login', '/register'].includes(from)
      ? from
      : '/dashboard';
  if (user) return <Navigate to={destination} replace />;
  async function submit(values: Values) {
    setError('');
    try {
      authenticate(
        await api<AuthResponse>(`/auth/${mode}`, {
          method: 'POST',
          body: JSON.stringify(
            isRegister
              ? values
              : { email: values.email, password: values.password },
          ),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    }
  }
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-6 sm:px-10">
        <Link to="/">
          <Brand />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md px-5 pb-14 pt-12 sm:pt-20">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-primary">
          Less chaos. More shipping.
        </p>
        <h1 className="text-center text-3xl font-semibold tracking-tight">
          {isRegister ? 'Start your BugLife' : 'Welcome back'}
        </h1>
        <p className="mb-8 mt-3 text-center text-sm text-muted-foreground">
          {isRegister
            ? 'Your next great project deserves a better bug tracker.'
            : 'Sign in to your workspace and pick up where you left off.'}
        </p>
        <Card className="p-6 sm:p-8">
          <form
            noValidate
            onSubmit={handleSubmit(submit)}
            className="space-y-5"
          >
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Samar Sharma"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p
                    id="name-error"
                    className="mt-1.5 text-xs text-destructive"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={
                  isRegister ? 'At least 8 characters' : 'Enter your password'
                }
                {...register('password')}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-xs text-destructive"
                >
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {isSubmitting
                ? 'Please wait…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
              {!isSubmitting && <ArrowRight size={16} />}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? 'Already have an account?' : 'New to BugLife?'}{' '}
          <Link
            className="font-medium text-primary hover:underline"
            to={isRegister ? '/login' : '/register'}
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        <p className="mt-12 text-center text-xs text-muted-foreground">
          Because Every Project Has Bugs.
        </p>
      </main>
    </div>
  );
}
