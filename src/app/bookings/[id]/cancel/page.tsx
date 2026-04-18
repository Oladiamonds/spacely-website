'use client';

import { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatNaira } from '@/types';

async function fetchBooking(id: string) {
  const res = await fetch(`/api/bookings/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export default function CancelBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<{
    refundPct: number;
    refundNaira: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBooking(id),
  });

  function hoursUntilStart(): number {
    if (!booking) return 0;
    return (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
  }

  function getRefundPreview(): { pct: number; label: string } {
    const h = hoursUntilStart();
    if (h >= 24) return { pct: 100, label: 'Full refund' };
    if (h >= 12) return { pct: 50, label: '50% refund' };
    return { pct: 0, label: 'No refund' };
  }

  function handleCancel() {
    setError('');
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to cancel booking');
        return;
      }
      setResult(data);
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="skeleton h-8 w-48 rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground">Booking not found.</p>
        <Link href="/bookings" className="text-primary hover:underline text-sm">← My bookings</Link>
      </div>
    );
  }

  const { pct, label } = getRefundPreview();
  const refundAmount = Math.round(booking.totalAmountKobo * pct / 100);

  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="font-display text-xl font-bold text-foreground">Booking cancelled</h1>
          <p className="text-sm text-muted-foreground">{result.message}</p>
          {result.refundNaira > 0 && (
            <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
              <p className="text-sm font-semibold text-green-800">
                Refund: ₦{result.refundNaira.toLocaleString('en-NG')}
              </p>
              <p className="text-xs text-green-700 mt-0.5">3–5 business days to your original payment method</p>
            </div>
          )}
          <Link
            href="/bookings"
            className="btn-primary inline-block rounded-xl px-8 py-3 font-semibold mt-2"
          >
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/bookings" className="text-sm text-muted-foreground hover:text-foreground">
            ← My bookings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="font-display text-xl font-bold text-foreground">Cancel booking?</h1>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>

          {/* Booking summary */}
          <div className="rounded-xl bg-neutral-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Space</span>
              <span className="font-medium text-foreground">{booking.space?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">
                {new Date(booking.startTime).toLocaleDateString('en-NG', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-foreground">
                {new Date(booking.startTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(booking.endTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
              <span className="font-semibold text-foreground">Paid</span>
              <span className="font-bold text-foreground">{formatNaira(booking.totalAmountKobo)}</span>
            </div>
          </div>

          {/* Refund policy */}
          <div className={`rounded-xl px-4 py-3 border text-sm ${
            pct === 100 ? 'bg-green-50 border-green-100' :
            pct === 50 ? 'bg-amber-50 border-amber-100' :
            'bg-red-50 border-red-100'
          }`}>
            <p className={`font-semibold ${
              pct === 100 ? 'text-green-800' : pct === 50 ? 'text-amber-800' : 'text-red-800'
            }`}>
              {label} — {refundAmount > 0 ? formatNaira(refundAmount) : 'no refund'}
            </p>
            <p className={`text-xs mt-0.5 ${
              pct === 100 ? 'text-green-700' : pct === 50 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {pct === 100 ? '>24h before start · full refund applies' :
               pct === 50 ? '12–24h before start · 50% refund applies' :
               '<12h before start · no refund applies per policy'}
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/bookings"
              className="btn-ghost flex-1 rounded-xl h-12 border border-neutral-200 flex items-center justify-center text-sm font-medium"
            >
              Keep booking
            </Link>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 h-12 rounded-xl bg-red-500 text-white font-semibold text-sm disabled:opacity-60 hover:bg-red-600 transition-colors"
            >
              {isPending ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
