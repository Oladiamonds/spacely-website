'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Role = 'ARTISAN' | 'OWNER';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') ?? '';

  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<Role>('ARTISAN');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!email || !email.includes('@')) { setError('Valid email is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    startTransition(async () => {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
          data: {
            full_name: fullName,
            phone: phone || null,
            role,
            referral_code: referralCode || null,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      // Claim referral if code was provided
      if (referralCode && data.user) {
        await fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode }),
        }).catch(() => {});
      }

      router.push('/onboarding?welcome=1');
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-bold text-primary">
            SpaceLY
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Create your account</h1>
          {referralCode && (
            <p className="mt-1 text-sm text-forest font-medium">
              🎉 You were referred! You'll get ₦2,500 in wallet credit.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {step === 'role' ? (
            <div>
              <p className="text-sm font-medium text-foreground mb-4 text-center">
                I want to…
              </p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  {
                    value: 'ARTISAN' as Role,
                    label: 'Book spaces',
                    sub: 'I'm a creator, photographer, musician, chef or stylist',
                    emoji: '🎨',
                  },
                  {
                    value: 'OWNER' as Role,
                    label: 'List my space',
                    sub: 'I own or manage a creative workspace',
                    emoji: '🏢',
                  },
                ] as const).map(({ value, label, sub, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRole(value); setStep('details'); }}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all hover:border-primary ${
                      role === value ? 'border-primary bg-primary/5' : 'border-neutral-200'
                    }`}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('role')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                ← Change role
              </button>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Tola Adeyemi"
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

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
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                  Phone number <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <span className="flex h-11 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-muted-foreground">
                    🇳🇬 +234
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="0801 234 5678"
                    className="h-11 flex-1 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary h-11 w-full rounded-xl font-semibold disabled:opacity-60"
              >
                {isPending ? 'Creating account…' : `Create ${role === 'ARTISAN' ? 'artisan' : 'owner'} account`}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                By signing up you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
