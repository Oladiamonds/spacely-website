'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Bank {
  name: string;
  code: string;
}

async function fetchBanks(): Promise<Bank[]> {
  const res = await fetch('/api/owner/subaccount');
  if (!res.ok) return [];
  const data = await res.json();
  return data.banks ?? [];
}

async function fetchProfile() {
  const res = await fetch('/api/users/me');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default function PayoutSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: fetchBanks,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const { data: profile } = useQuery({
    queryKey: ['profile-me'],
    queryFn: fetchProfile,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bankCode) { setError('Please select a bank'); return; }
    if (!/^\d{10}$/.test(accountNumber)) { setError('Account number must be exactly 10 digits'); return; }

    startTransition(async () => {
      const res = await fetch('/api/owner/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode, accountNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to set up payout account');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      setSuccess(`Account verified: ${data.accountName}. Payouts are now enabled.`);
    });
  }

  if (profile?.paystackSubaccountCode) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h1 className="font-display text-xl font-bold text-foreground">Payout account connected</h1>
            <div className="rounded-xl bg-neutral-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account name</span>
                <span className="font-medium">{profile.bankAccountName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-green-700">Active</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              To change your payout account, please contact{' '}
              <a href="mailto:support@spacely.ng" className="text-primary hover:underline">support@spacely.ng</a>.
            </p>
            <Link href="/dashboard" className="btn-primary inline-block rounded-xl px-6 py-2.5 text-sm font-semibold">
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Set up payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your Nigerian bank account to receive 85% of each booking automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <div>
            <label htmlFor="bank" className="block text-sm font-medium text-foreground mb-1.5">
              Bank <span className="text-red-500">*</span>
            </label>
            {loadingBanks ? (
              <div className="h-11 rounded-xl bg-neutral-100 animate-pulse" />
            ) : (
              <select
                id="bank"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">Select your bank…</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="acct" className="block text-sm font-medium text-foreground mb-1.5">
              Account number <span className="text-red-500">*</span>
            </label>
            <input
              id="acct"
              type="text"
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0123456789"
              required
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">10-digit NUBAN account number</p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800 font-medium">
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !bankCode || accountNumber.length !== 10}
            className="btn-primary w-full rounded-xl h-12 font-semibold disabled:opacity-50"
          >
            {isPending ? 'Verifying account…' : 'Connect bank account →'}
          </button>

          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How payouts work</p>
            <p>• You receive 85% of each completed booking amount</p>
            <p>• Payouts are processed within 24 hours of session completion</p>
            <p>• Powered by Paystack — your account details are encrypted and stored securely</p>
          </div>
        </form>
      </main>
    </div>
  );
}
