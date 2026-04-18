import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { SpaceStatus } from '@/types';
import { SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';

const STATUS_OPTIONS = ['all', 'PENDING_REVIEW', 'LIVE', 'PAUSED', 'SUSPENDED', 'DRAFT'] as const;

const STATUS_STYLES: Record<SpaceStatus | 'all', string> = {
  all:            'bg-neutral-100 text-neutral-600',
  DRAFT:          'bg-neutral-100 text-neutral-500',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700',
  LIVE:           'bg-green-50 text-green-700',
  PAUSED:         'bg-blue-50 text-blue-700',
  SUSPENDED:      'bg-red-50 text-red-600',
};

export default async function AdminSpacesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/spaces');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== 'ADMIN') redirect('/dashboard');

  const sp = await searchParams;
  const statusFilter = sp.status ?? 'PENDING_REVIEW';
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = statusFilter === 'all' ? {} : { status: statusFilter as SpaceStatus };

  const [spaces, total] = await Promise.all([
    prisma.space.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        owner: { select: { id: true, fullName: true, phone: true } },
        photos: { where: { isHero: true }, select: { cloudinaryUrl: true }, take: 1 },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.space.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 uppercase tracking-wide">Admin</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Spaces</span>
            <Link href="/admin/users" className="hover:text-foreground">Users</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Space moderation</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{total} space{total !== 1 ? 's' : ''} · {statusFilter === 'all' ? 'all statuses' : statusFilter.replace('_', ' ').toLowerCase()}</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s}
              href={`/admin/spaces?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'bg-white border border-neutral-200 text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </Link>
          ))}
        </div>

        {spaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-16 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm text-muted-foreground">No spaces in this queue.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">Space</th>
                    <th className="px-5 py-3 text-left font-medium">Owner</th>
                    <th className="px-5 py-3 text-left font-medium">Type</th>
                    <th className="px-5 py-3 text-center font-medium">Bookings</th>
                    <th className="px-5 py-3 text-center font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {spaces.map((space) => {
                    const status = space.status as SpaceStatus;
                    const heroPhoto = space.photos[0]?.cloudinaryUrl;
                    return (
                      <tr key={space.id} className="hover:bg-neutral-50/50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-neutral-100 relative">
                              {heroPhoto ? (
                                <Image src={heroPhoto} alt={space.name} fill className="object-cover" sizes="40px" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg">
                                  {SPACE_TYPE_EMOJI[space.type]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{space.name}</p>
                              <p className="text-xs text-muted-foreground">{space.neighborhood}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-foreground">{space.owner.fullName}</p>
                          <p className="text-xs text-muted-foreground">{space.owner.phone}</p>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {SPACE_TYPE_EMOJI[space.type]} {SPACE_TYPE_LABELS[space.type]}
                        </td>
                        <td className="px-5 py-3.5 text-center text-muted-foreground">
                          {space._count.bookings}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/spaces/lagos/${space.slug}`}
                              target="_blank"
                              className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50"
                            >
                              Preview
                            </Link>
                            {status === 'PENDING_REVIEW' && (
                              <>
                                <AdminAction spaceId={space.id} newStatus="LIVE" label="Approve" variant="success" />
                                <AdminAction spaceId={space.id} newStatus="SUSPENDED" label="Reject" variant="danger" />
                              </>
                            )}
                            {status === 'LIVE' && (
                              <AdminAction spaceId={space.id} newStatus="SUSPENDED" label="Suspend" variant="danger" />
                            )}
                            {status === 'SUSPENDED' && (
                              <AdminAction spaceId={space.id} newStatus="LIVE" label="Restore" variant="success" />
                            )}
                            {status === 'PAUSED' && (
                              <AdminAction spaceId={space.id} newStatus="LIVE" label="Activate" variant="success" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/spaces?status=${statusFilter}&page=${page - 1}`} className="rounded-xl border border-neutral-200 px-4 py-2 hover:bg-neutral-50">← Previous</Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/spaces?status=${statusFilter}&page=${page + 1}`} className="rounded-xl border border-neutral-200 px-4 py-2 hover:bg-neutral-50">Next →</Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Inline client action button component
async function updateSpaceStatus(spaceId: string, newStatus: SpaceStatus) {
  'use server';
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const { prisma: serverPrisma } = await import('@/lib/prisma');
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const dbUser = await serverPrisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== 'ADMIN') return;
  await serverPrisma.space.update({
    where: { id: spaceId },
    data: {
      status: newStatus,
      ...(newStatus === 'LIVE' && { isSpacelyVerified: true, verifiedAt: new Date() }),
    },
  });
}

function AdminAction({
  spaceId,
  newStatus,
  label,
  variant,
}: {
  spaceId: string;
  newStatus: SpaceStatus;
  label: string;
  variant: 'success' | 'danger';
}) {
  const color = variant === 'success'
    ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100'
    : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100';

  return (
    <form action={updateSpaceStatus.bind(null, spaceId, newStatus)}>
      <button
        type="submit"
        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${color}`}
      >
        {label}
      </button>
    </form>
  );
}
