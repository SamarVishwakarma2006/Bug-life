import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
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
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters.')
    .max(80, 'Use at most 80 characters.'),
  password: z.string().min(8, 'Use at least 8 characters.').pipe(password),
});
type Values = z.infer<typeof formSchema>;

function getSafeDestination(from: unknown): string {
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//') ||
    from.includes('\\')
  )
    return '/dashboard';
  const pathname = from.split(/[?#]/)[0]?.replace(/\/+$/, '');
  return pathname === '/login' || pathname === '/register'
    ? '/dashboard'
    : from;
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-zinc-800/90 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0079da] disabled:opacity-60';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const { user, loading, authenticate } = useAuth();
  const location = useLocation();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(isRegister ? registerSchema : formSchema),
  });
  const from = (location.state as { from?: unknown } | null)?.from;
  const destination = getSafeDestination(from);

  if (user) return <Navigate to={destination} replace />;

  async function submit(values: Values) {
    setError('');
    try {
      const response = await api<AuthResponse>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(
          isRegister
            ? values
            : { email: values.email, password: values.password },
        ),
      });
      if (mounted.current) authenticate(response);
    } catch (err) {
      if (!mounted.current) return;
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid email or password.'
          : err instanceof Error
            ? err.message
            : 'Please try again.',
      );
    }
  }

  return (
    <LoginHero
      title={isRegister ? 'Create your account' : 'Log in to BugLife'}
      subtitle={
        isRegister
          ? 'Bring your team together. Start squashing bugs.'
          : 'Welcome back. Your team is waiting.'
      }
    >
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className="space-y-5"
        aria-busy={isSubmitting}
      >
        {isRegister && (
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Full name
            </label>
            <input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              {...register('name')}
              className={inputClass}
              disabled={isSubmitting || loading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-2 text-sm text-red-300">
                {errors.name.message}
              </p>
            )}
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            {...register('email')}
            className={inputClass}
            disabled={isSubmitting || loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-2 text-sm text-red-300">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={
                isRegister ? 'At least 8 characters' : 'Enter your password'
              }
              {...register('password')}
              className={`${inputClass} pr-14`}
              disabled={isSubmitting || loading}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password
                  ? 'password-error'
                  : isRegister
                    ? 'password-hint'
                    : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={isSubmitting || loading}
              className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="mt-2 text-sm text-red-300">
              {errors.password.message}
            </p>
          ) : (
            isRegister && (
              <p id="password-hint" className="mt-2 text-xs text-zinc-400">
                Use at least 8 characters.
              </p>
            )
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0079da] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#086dc0] focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting
            ? 'Please wait…'
            : loading
              ? 'Checking session…'
              : isRegister
                ? 'Create account'
                : 'Log in'}
          {!isSubmitting && !loading && (
            <ArrowRight size={18} aria-hidden="true" />
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-400">
        {isRegister ? 'Already have an account? ' : 'New to BugLife? '}
        <Link
          to={isRegister ? '/login' : '/register'}
          state={{ from: destination }}
          className="rounded font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
      <p className="mt-8 text-center text-xs text-zinc-500">
        Because Every Project Has Bugs.
      </p>
    </LoginHero>
  );
}
