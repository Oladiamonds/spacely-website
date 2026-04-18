'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ReviewModal } from '@/components/ui/ReviewModal';

async function fetchBooking(id: string) {
  const res = await fetch(`/api/bookings/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [done, setDone] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBooking(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="skeleton h-8 w-48 rounded-xl" />
      </div>
    );
  }

  if (!booking || booking.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground">This booking is not eligible for review.</p>
        <Link href="/bookings" className="text-primary hover:underline text-sm">← My bookings</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center space-y-4">
          <div className="text-5xl">⭐</div>
          <h1 className="font-display text-xl font-bold text-foreground">Thanks for your review!</h1>
          <p className="text-sm text-muted-foreground">
            Your review helps other artisans find great spaces.
          </p>
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
    <ReviewModal
      bookingId={id}
      spaceName={booking.space?.name ?? 'the space'}
      onSuccess={() => setDone(true)}
      onClose={() => router.push('/bookings')}
    />
  );
}
