'use client';

import { useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { formatNaira } from '@/types';

const STEPS = ['Select dates', 'Review', 'Payment', 'Confirmed'] as const;
type Step = 0 | 1 | 2 | 3;

async function fetchSpace(id: string) {
  const res = await fetch(`/api/spaces/${id}`);
  if (!res.ok) throw new Error('Failed to load space');
  return res.json();
}

export default function BookingPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>(0);
  const [selection, setSelection] = useState<{
    date: string;
    startHour: number;
    endHour: number;
    totalKobo: number;
  } | null>(null);
  const [booking, setBooking] = useState<{
    bookingId: string;
    paymentUrl: string;
    reference: string;
    heldUntil: string;
    totalAmountKobo: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => fetchSpace(spaceId),
  });

  const handleSelection = useCallback(
    (params: { date: string; startHour: number; endHour: number; totalKobo: number }) => {
      setSelection(params);
    },
    [],
  );

  function toISOWithHour(date: string, hour: number) {
    return `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;
  }

  async function handleConfirmBooking() {
    if (!selection) return;
    setError('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spaceId,
            startTime: toISOWithHour(selection.date, selection.startHour),
            endTime: toISOWithHour(selection.date, selection.endHour),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? 'Failed to create booking');
          return;
        }

        setBooking(data);
        setStep(2);
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  }

  function handlePay() {
    if (booking?.paymentUrl) {
      window.location.href = booking.paymentUrl;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="skeleton h-8 w-48 rounded-xl" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground">Space not found</p>
        <Link href="/spaces/lagos" className="text-primary hover:underline text-sm">
          ← Back to search
        </Link>
      </div>
    );
  }

  const totalHours = selection ? selection.endHour - selection.startHour : 0;
  const depositKobo = space.securityDepositKobo ?? 0;
  const totalKobo = selection ? selection.totalKobo + depositKobo : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href={`/spaces/lagos/${space.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {space.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < step ? 'bg-primary text-white' :
                  i === step ? 'bg-primary text-white ring-4 ring-primary/20' :
                  'bg-neutral-200 text-muted-foreground'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 ${i < step ? 'bg-primary' : 'bg-neutral-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-foreground">{STEPS[step]}</p>
        </div>

        {/* Step 0: Date/time selection */}
        {step === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">Pick your time</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {formatNaira(space.pricePerHourKobo)}/hour · Min {space.minBookingHours}h booking
            </p>

            <BookingCalendar
              spaceId={spaceId}
              minBookingHours={space.minBookingHours ?? 1}
              pricePerHourKobo={space.pricePerHourKobo}
              onSelection={handleSelection}
            />

            <button
              onClick={() => setStep(1)}
              disabled={!selection || totalHours < (space.minBookingHours ?? 1)}
              className="btn-primary w-full mt-6 rounded-xl h-12 font-semibold disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 1: Review */}
        {step === 1 && selection && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h2 className="font-display text-xl font-bold text-foreground">Review your booking</h2>

            {/* Space summary */}
            <div className="flex items-center gap-4 rounded-xl bg-neutral-50 p-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                🏢
              </div>
              <div>
                <p className="font-semibold text-foreground">{space.name}</p>
                <p className="text-sm text-muted-foreground">{space.neighborhood}, {space.city}</p>
              </div>
            </div>

            {/* Booking details */}
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium text-foreground">{selection.date}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Time</dt>
                <dd className="font-medium text-foreground">
                  {String(selection.startHour).padStart(2, '0')}:00 –{' '}
                  {String(selection.endHour).padStart(2, '0')}:00 ({totalHours}h)
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">
                  Booking ({totalHours}h × {formatNaira(space.pricePerHourKobo)})
                </dt>
                <dd className="font-medium text-foreground">{formatNaira(selection.totalKobo)}</dd>
              </div>
              {depositKobo > 0 && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Refundable deposit</dt>
                  <dd className="font-medium text-foreground">{formatNaira(depositKobo)}</dd>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-neutral-100 pt-3">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-bold text-foreground text-base">{formatNaira(totalKobo)}</dd>
              </div>
            </dl>

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="btn-ghost flex-1 rounded-xl h-12 border border-neutral-200"
              >
                ← Edit
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isPending}
                className="btn-primary flex-1 rounded-xl h-12 font-semibold disabled:opacity-60"
              >
                {isPending ? 'Reserving slot…' : 'Confirm & Pay →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && booking && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-3xl">
              🔐
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Slot reserved!</h2>
            <p className="text-sm text-muted-foreground">
              Your slot is held for{' '}
              <span className="font-semibold text-foreground">15 minutes</span>.
              Complete payment to confirm your booking.
            </p>

            <div className="rounded-xl bg-neutral-50 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount due</span>
                <span className="font-bold text-foreground">{formatNaira(booking.totalAmountKobo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs text-foreground">{booking.reference}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              className="btn-primary w-full rounded-xl h-12 font-semibold text-base"
            >
              Pay {formatNaira(booking.totalAmountKobo)} via Paystack
            </button>

            <p className="text-xs text-muted-foreground">
              Secured by Paystack · Card, bank transfer, USSD accepted
            </p>
          </div>
        )}

        {/* Step 3: Confirmed (reached via Paystack callback redirect) */}
        {step === 3 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="font-display text-2xl font-bold text-foreground">Booking confirmed!</h2>
            <p className="text-muted-foreground text-sm">
              You'll receive a confirmation SMS and your access details shortly.
            </p>
            <Link href="/bookings" className="btn-primary inline-block rounded-xl px-8 py-3 font-semibold mt-4">
              View my bookings →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
