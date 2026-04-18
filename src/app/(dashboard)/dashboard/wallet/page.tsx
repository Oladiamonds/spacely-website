'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatNaira } from '@/types';

const TOP_UP_PRESETS = [2000000, 5000000, 10000000, 20000000]; // ₦20k, ₦50k, ₦100k, ₦200k

async function fetchWallet() {
  const res = await fetch('/api/wallet');
  if (!res.ok) throw new Error('Failed to load wallet');
  return res.json() as Promise<{ balanceKobo: number; totalToppedUpKobo: number; totalSpentKobo: number }>;
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });

  async function handleTopUp() {
    setError('');
    const kobo = Math.round(parseFloat(amount) * 100);
    if (!kobo || kobo < 100_000) {
      setError('Minimum top-up is ₦1,000');
      return;
    }
    if (kobo > 50_000_000) {
      setError('Maximum top-up is ₦500,000 per transaction');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountKobo: kobo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to initiate top-up');
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Wallet</h1>

        {/* Balance card */}
        <div className="rounded-2xl bg-primary p-6 text-white">
          <p className="text-sm font-medium opacity-80">Available balance</p>
          {isLoading ? (
            <div className="mt-1 h-9 w-40 rounded-lg bg-white/20 animate-pulse" />
          ) : (
            <p className="mt-1 font-display text-4xl font-bold">{formatNaira(wallet?.balanceKobo ?? 0)}</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
            <div>
              <p className="text-xs opacity-70">Total topped up</p>
              <p className="text-sm font-semibold">{formatNaira(wallet?.totalToppedUpKobo ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Total spent</p>
              <p className="text-sm font-semibold">{formatNaira(wallet?.totalSpentKobo ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* Top-up */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Top up wallet</h2>

          <div className="grid grid-cols-4 gap-2">
            {TOP_UP_PRESETS.map((kobo) => (
              <button
                key={kobo}
                type="button"
                onClick={() => setAmount(String(kobo / 100))}
                className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                  parseFloat(amount) * 100 === kobo
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-neutral-200 text-foreground hover:border-primary/40'
                }`}
              >
                {formatNaira(kobo)}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1.5">
              Or enter amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <input
                id="amount"
                type="number"
                min="1000"
                max="500000"
                step="500"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="e.g. 20000"
                className="h-11 w-full rounded-xl border border-neutral-200 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleTopUp}
            disabled={isPending || !amount}
            className="btn-primary w-full rounded-xl h-12 font-semibold disabled:opacity-50"
          >
            {isPending ? 'Redirecting to Paystack…' : 'Top up via Paystack →'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Secured by Paystack · Card, bank transfer, USSD accepted
          </p>
        </div>

        {/* Info */}
        <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">How it works</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
            <li>Top up your wallet using card, bank transfer, or USSD via Paystack</li>
            <li>Wallet balance is applied at checkout to cover bookings</li>
            <li>Referral credits (₦2,500) are automatically added to your wallet</li>
            <li>Wallet balance does not expire</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
