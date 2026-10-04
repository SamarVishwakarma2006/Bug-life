import { useState, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoginHero } from '@/components/ui/login-hero';
import { api, ApiError } from '@/services/api';
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

function getSafeDestination(fromState: unknown): string {
  if (
    typeof fromState === 'string' &&
    fromState.startsWith('/') &&
    !fromState.startsWith('//') &&
    !['/login', '/register'].includes(fromState)
  ) {
    return fromState;
  }
  return '/dashboard';
}

function LoginPage() {
  const { user, authenticate } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pendingAuthRef = useRef<AuthResponse | null>(null);

  const from = (location.state as { from?: unknown } | null)?.from;
  const destination = getSafeDestination(from);

  if (user) return <Navigate to={destination} replace />;

  const handleLogin = async (rawEmail: string, rawPassword: string): Promise<void> => {
    // 1. Zod schema validation
    const validation = formSchema.safeParse({
      email: rawEmail,
      password: rawPassword,
    });
    if (!validation.success) {
      const issue = validation.error.issues[0];
      throw new Error(issue?.message || 'Invalid input.');
    }

    // 2. Call existing API
    try {
      const response = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: validation.data.email,
          password: validation.data.password,
        }),
      });
      pendingAuthRef.current = response;
    } catch (err: unknown) {
      const status =
        err instanceof ApiError
          ? err.status
          : typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status: number }).status
            : undefined;

      if (status !== undefined) {
        if (status === 400) {
          throw new Error((err as Error).message || 'Invalid request.');
        }
        if (status === 401) {
          throw new Error('Invalid email or password.');
        }
        if (status === 429) {
          throw new Error('Too many attempts. Please wait a few minutes and try again.');
        }
        if (status === 0) {
          throw new Error("Can't reach the server. Check your connection.");
        }
        throw new Error((err as Error).message || 'Something went wrong. Please try again.');
      }
      if (err instanceof Error) {
        const lower = err.message.toLowerCase();
        if (
          err.name === 'TypeError' ||
          lower.includes('fetch') ||
          lower.includes('network') ||
          lower.includes('failed to fetch')
        ) {
          throw new Error("Can't reach the server. Check your connection.");
        }
        throw err;
      }
      throw new Error('Something went wrong. Please try again.');
    }
  };

  const handleSuccess = () => {
    if (pendingAuthRef.current) {
      authenticate(pendingAuthRef.current);
    }
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen bg-black">
      <LoginHero
        onLogin={handleLogin}
        onSuccess={handleSuccess}
        footer={
          <div className="flex flex-col items-center gap-1.5">
            <Link
              to="/register"
              className="text-sm text-zinc-400 hover:text-white underline-offset-4 hover:underline"
            >
              New here? Create an account
            </Link>
            <span className="text-xs text-zinc-500">
              Demo: samar@demo.dev / password123
            </span>
          </div>
        }
      />
    </div>
  );
}

function RegisterPage() {
  const { user, authenticate } = useAuth();
  const location = useLocation();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(registerSchema),
  });

  const from = (location.state as { from?: unknown } | null)?.from;
  const destination = getSafeDestination(from);

  if (user) return <Navigate to={destination} replace />;

  async function submit(values: Values) {
    setError('');
    try {
      authenticate(
        await api<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(values),
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
          Start your BugLife
        </h1>
        <p className="mb-8 mt-3 text-center text-sm text-muted-foreground">
          Your next great project deserves a better bug tracker.
        </p>
        <Card className="p-6 sm:p-8">
          <form
            noValidate
            onSubmit={handleSubmit(submit)}
            className="space-y-5"
          >
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
              {isSubmitting ? 'Please wait…' : 'Create account'}
              {!isSubmitting && <ArrowRight size={16} />}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            className="font-medium text-primary hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-12 text-center text-xs text-muted-foreground">
          Because Every Project Has Bugs.
        </p>
      </main>
    </div>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  if (mode === 'login') {
    return <LoginPage />;
  }
  return <RegisterPage />;
}
