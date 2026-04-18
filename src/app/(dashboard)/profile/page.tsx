'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchProfile() {
  const res = await fetch('/api/users/me');
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-me'],
    queryFn: fetchProfile,
  });

  const [fullName, setFullName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Populate fields once profile loads (only on first load)
  const [seeded, setSeeded] = useState(false);
  if (profile && !seeded) {
    setFullName(profile.fullName ?? '');
    setInstagramHandle(profile.instagramHandle ?? '');
    setPortfolioUrl(profile.portfolioUrl ?? '');
    setSeeded(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          instagramHandle: instagramHandle.trim() || null,
          portfolioUrl: portfolioUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update profile');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      setSuccess('Profile updated successfully.');
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-48 rounded-xl bg-neutral-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Edit profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your name and social links.</p>
        </div>

        {/* Trust / verification status */}
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">ID Verification</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile?.ninVerified
                ? 'Your NIN is verified — your trust score is boosted.'
                : 'Verify your NIN to unlock higher trust and more bookings.'}
            </p>
          </div>
          {profile?.ninVerified ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">✓ Verified</span>
          ) : (
            <Link
              href="/profile/verify"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Verify now →
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={80}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-foreground mb-1.5">
              Instagram handle <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <input
                id="instagram"
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                maxLength={40}
                className="h-11 w-full rounded-xl border border-neutral-200 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="portfolio" className="block text-sm font-medium text-foreground mb-1.5">
              Portfolio URL <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="portfolio"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800 font-medium">
              ✓ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full rounded-xl h-12 font-semibold disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Quick links */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</p>
          <Link
            href="/settings/payout"
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Payout settings</span>
            <span className="text-muted-foreground text-sm">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
