import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatNaira } from '@/types';
import type { BookingStatus } from '@/types';

const STATUS_STYLES: Record<BookingStatus, string> = {
  HELD:      'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-green-50 text-green-700',
  COMPLETED: 'bg-neutral-100 text-neutral-600',
  CANCELLED: 'bg-red-50 text-red-600',
  DISPUTED:  'bg-orange-50 text-orange-700',
  REFUNDED:  'bg-blue-50 text-blue-600',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  HELD:      'Awaiting payment',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED:  'Disputed',
  REFUNDED:  'Refunded',
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/bookings');

  const sp = await searchParams;
  const tab = sp.tab ?? 'upcoming';

  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      artisanId: user.id,
      ...(tab === 'upcoming'
        ? { status: { in: ['HELD', 'CONFIRMED'] }, startTime: { gte: now } }
        : tab === 'past'
        ? { status: { in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] } }
        : {}),
    },
    orderBy: { startTime: tab === 'upcoming' ? 'asc' : 'desc' },
    take: 30,
    include: {
      space: {
        select: {
          name: true,
          address: true,
          neighborhood: true,
          city: true,
          type: true,
          slug: true,
          photos: { where: { isHero: true }, select: { cloudinaryUrl: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">My bookings</h1>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-neutral-200 bg-white p-1 mb-6 gap-1">
          {(['upcoming', 'past', 'all'] as const).map((t) => (
            <Link
              key={t}
              href={`/bookings?tab=${t}`}
              className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
                tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
            <p className="text-3xl" aria-hidden="true">📅</p>
            <h3 className="mt-4 text-base font-semibold text-foreground">No bookings here</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === 'upcoming' ? 'No upcoming bookings. Ready to create?' : 'No past bookings yet.'}
            </p>
            {tab === 'upcoming' && (
              <Link href="/spaces/lagos" className="btn-primary mt-5 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold">
                Find a space →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const heroPhoto = booking.space?.photos[0]?.cloudinaryUrl;
              const status = booking.status as BookingStatus;
              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {heroPhoto ? (
                        <Image src={heroPhoto} alt={booking.space?.name ?? ''} fill className="object-cover" sizes="72px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🏢</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground line-clamp-1">{booking.space?.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {booking.space?.neighborhood}, {booking.space?.city}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.startTime).toLocaleDateString('en-NG', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                        {' · '}
                        {new Date(booking.startTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(booking.endTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatNaira(booking.totalAmountKobo)}
                    </span>
                    <div className="flex gap-2">
                      {status === 'HELD' && booking.paystackReference && (
                        <a
                          href={`/book/${booking.spaceId}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Complete payment →
                        </a>
                      )}
                      {status === 'COMPLETED' && (
                        <Link
                          href={`/bookings/${booking.id}/review`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Leave a review →
                        </Link>
                      )}
                      {['HELD', 'CONFIRMED'].includes(status) && (
                        <Link
                          href={`/bookings/${booking.id}/cancel`}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Cancel
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
