'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
      router.refresh();
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMagicLinkSent(true);
    });
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream/30 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="font-display text-2xl font-bold text-foreground">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="mt-6 text-sm text-primary hover:underline"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-bold text-primary">
            SpaceLY
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl border border-neutral-200 p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === 'password'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === 'magic'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Magic link
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>

            {mode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary h-11 w-full rounded-xl font-semibold disabled:opacity-60"
            >
              {isPending
                ? mode === 'password' ? 'Signing in…' : 'Sending link…'
                : mode === 'password' ? 'Sign in' : 'Send magic link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
