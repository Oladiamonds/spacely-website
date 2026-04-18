'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatNaira } from '@/types';

async function fetchWalletBalance(): Promise<{ balanceKobo: number }> {
  const res = await fetch('/api/wallet');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export function WalletCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWalletBalance,
    staleTime: 60_000,
  });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wallet balance</p>
        <Link href="/dashboard/wallet" className="text-xs text-primary font-medium hover:underline">
          Top up →
        </Link>
      </div>
      {isLoading ? (
        <div className="h-8 w-32 rounded-lg bg-neutral-100 animate-pulse" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Unavailable</p>
      ) : (
        <p className="text-2xl font-bold text-foreground font-display">
          {formatNaira(data?.balanceKobo ?? 0)}
        </p>
      )}
    </div>
  );
}
