import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatNaira, SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';
import type { SpaceStatus } from '@/types';

const STATUS_STYLES: Record<SpaceStatus, string> = {
  DRAFT:          'bg-neutral-100 text-neutral-600',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700',
  LIVE:           'bg-green-50 text-green-700',
  PAUSED:         'bg-blue-50 text-blue-700',
  SUSPENDED:      'bg-red-50 text-red-600',
};

export default async function OwnerListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/listings');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== 'OWNER') redirect('/dashboard');

  const spaces = await prisma.space.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      photos: { where: { isHero: true }, select: { cloudinaryUrl: true }, take: 1 },
      _count: { select: { bookings: { where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } } } },
    },
  });

  // Aggregate revenue per space
  const revenueBySpace = await prisma.booking.groupBy({
    by: ['spaceId'],
    where: {
      space: { ownerId: user.id },
      status: 'COMPLETED',
    },
    _sum: { ownerPayoutKobo: true },
  });
  const revenueMap = Object.fromEntries(
    revenueBySpace.map((r) => [r.spaceId, r._sum.ownerPayoutKobo ?? 0]),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <Link href="/dashboard/earnings" className="hover:text-foreground">Earnings</Link>
            <span className="text-foreground font-medium">Listings</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">My listings</h1>
            <p className="mt-1 text-sm text-muted-foreground">{spaces.length} space{spaces.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/dashboard/listings/new" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
            + New listing
          </Link>
        </div>

        {spaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-16 text-center">
            <p className="text-4xl mb-4">🏢</p>
            <h3 className="text-lg font-semibold text-foreground">No listings yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Create your first listing and start earning from your creative space.
            </p>
            <Link href="/dashboard/listings/new" className="btn-primary mt-6 inline-block rounded-xl px-6 py-3 font-semibold">
              Create listing →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => {
              const heroPhoto = space.photos[0]?.cloudinaryUrl;
              const status = space.status as SpaceStatus;
              const revenue = revenueMap[space.id] ?? 0;

              return (
                <div key={space.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                  <div className="relative aspect-video bg-neutral-100">
                    {heroPhoto ? (
                      <Image src={heroPhoto} alt={space.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        {SPACE_TYPE_EMOJI[space.type]}
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-1">{space.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {SPACE_TYPE_EMOJI[space.type]} {SPACE_TYPE_LABELS[space.type]} · {space.neighborhood}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-neutral-50 p-2">
                        <p className="text-xs text-muted-foreground">Price/hr</p>
                        <p className="text-sm font-bold text-foreground">{formatNaira(space.pricePerHourKobo)}</p>
                      </div>
                      <div className="rounded-lg bg-neutral-50 p-2">
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="text-sm font-bold text-foreground">{space._count.bookings}</p>
                      </div>
                      <div className="rounded-lg bg-neutral-50 p-2">
                        <p className="text-xs text-muted-foreground">Earned</p>
                        <p className="text-sm font-bold text-foreground">{formatNaira(revenue)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/dashboard/listings/${space.id}/edit`}
                        className="flex-1 rounded-xl border border-neutral-200 py-2 text-center text-sm font-medium text-foreground hover:bg-neutral-50"
                      >
                        Edit
                      </Link>
                      {space.status === 'LIVE' && (
                        <Link
                          href={`/spaces/lagos/${space.slug}`}
                          className="flex-1 rounded-xl bg-primary/10 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
                          target="_blank"
                        >
                          View →
                        </Link>
                      )}
                      {space.status === 'DRAFT' && (
                        <Link
                          href={`/dashboard/listings/${space.id}/edit`}
                          className="flex-1 rounded-xl bg-amber-50 py-2 text-center text-sm font-medium text-amber-700"
                        >
                          Complete
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
