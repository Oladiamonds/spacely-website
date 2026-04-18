import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatNaira } from '@/types';

// ─────────────────────────────────────────────────────────────
// Artisan dashboard — upcoming bookings + quick actions
// ─────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      avatarUrl: true,
      role: true,
      trustScore: true,
      ninVerified: true,
      bvnVerified: true,
    },
  });

  if (!dbUser) redirect('/onboarding');

  // Upcoming bookings (confirmed, future)
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      artisanId: user.id,
      status: { in: ['CONFIRMED'] },
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
    include: {
      space: {
        select: {
          name: true,
          address: true,
          neighborhood: true,
          type: true,
          photos: { where: { isHero: true }, select: { cloudinaryUrl: true }, take: 1 },
        },
      },
    },
  });

  // Past bookings count
  const pastCount = await prisma.booking.count({
    where: { artisanId: user.id, status: 'COMPLETED' },
  });

  const isOwner = dbUser.role === 'OWNER';

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold text-primary">
            SpaceLY
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/spaces/lagos" className="btn-ghost text-sm px-4 py-2 rounded-xl">
              Find a space
            </Link>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {dbUser.avatarUrl ? (
                <Image
                  src={dbUser.avatarUrl}
                  alt={dbUser.fullName}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-primary">
                  {dbUser.fullName.charAt(0)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back, {dbUser.fullName.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with your bookings.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Upcoming
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">
              {upcomingBookings.length}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Completed
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{pastCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Trust score
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">
              {dbUser.trustScore}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              ID Status
            </p>
            <p className="mt-2 text-sm font-semibold">
              {dbUser.ninVerified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <Link href="/profile/verify" className="text-amber-600 hover:underline">
                  Verify ID →
                </Link>
              )}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link href="/spaces/lagos" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
            Book a space
          </Link>
          {isOwner && (
            <Link href="/dashboard/listings" className="btn-ghost rounded-xl px-5 py-2.5 text-sm font-semibold border border-neutral-200">
              My listings
            </Link>
          )}
          <Link href="/bookings" className="btn-ghost rounded-xl px-5 py-2.5 text-sm font-semibold border border-neutral-200">
            All bookings
          </Link>
          <Link href="/profile" className="btn-ghost rounded-xl px-5 py-2.5 text-sm font-semibold border border-neutral-200">
            Edit profile
          </Link>
        </div>

        {/* Upcoming bookings */}
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-lg font-semibold text-foreground mb-4">
            Upcoming bookings
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
              <p className="text-3xl" aria-hidden="true">📅</p>
              <h3 className="mt-4 text-base font-semibold text-foreground">No upcoming bookings</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ready to create? Find your next space.
              </p>
              <Link
                href="/spaces/lagos"
                className="btn-primary mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold"
              >
                Explore spaces
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => {
                const heroPhoto = booking.space?.photos[0]?.cloudinaryUrl;
                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors"
                  >
                    {/* Space photo thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {heroPhoto ? (
                        <Image
                          src={heroPhoto}
                          alt={booking.space?.name ?? 'Space'}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">
                          🏢
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground line-clamp-1">
                        {booking.space?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.space?.neighborhood}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(booking.startTime).toLocaleDateString('en-NG', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        ·{' '}
                        {new Date(booking.startTime).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' – '}
                        {new Date(booking.endTime).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Amount + status */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatNaira(booking.totalAmountKobo)}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Confirmed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
