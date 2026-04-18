import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { formatNaira } from '@/types';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-foreground font-display">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function EarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/earnings');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== 'OWNER') redirect('/dashboard');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Aggregate completed booking payouts
  const [allTimeAgg, last30Agg, thisMonthAgg, pendingPayouts, recentBookings] = await Promise.all([
    prisma.booking.aggregate({
      where: { space: { ownerId: user.id }, status: 'COMPLETED' },
      _sum: { ownerPayoutKobo: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: {
        space: { ownerId: user.id },
        status: 'COMPLETED',
        updatedAt: { gte: thirtyDaysAgo },
      },
      _sum: { ownerPayoutKobo: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: {
        space: { ownerId: user.id },
        status: 'COMPLETED',
        updatedAt: { gte: startOfMonth },
      },
      _sum: { ownerPayoutKobo: true },
    }),
    prisma.payout.findMany({
      where: {
        ownerId: user.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        booking: {
          select: { startTime: true, space: { select: { name: true } } },
        },
      },
    }),
    prisma.booking.findMany({
      where: { space: { ownerId: user.id }, status: { in: ['COMPLETED', 'CONFIRMED'] } },
      orderBy: { startTime: 'desc' },
      take: 15,
      include: {
        space: { select: { name: true, neighborhood: true } },
        artisan: { select: { fullName: true, avatarUrl: true } },
        payout: { select: { status: true, processedAt: true } },
      },
    }),
  ]);

  const allTimeEarned = allTimeAgg._sum.ownerPayoutKobo ?? 0;
  const last30Earned = last30Agg._sum.ownerPayoutKobo ?? 0;
  const thisMonthEarned = thisMonthAgg._sum.ownerPayoutKobo ?? 0;

  const pendingTotal = pendingPayouts.reduce((acc, p) => acc + p.amountKobo, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <span className="text-foreground font-medium">Earnings</span>
            <Link href="/dashboard/listings" className="hover:text-foreground">Listings</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Earnings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your payout history and revenue overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="All-time earned"
            value={formatNaira(allTimeEarned)}
            sub={`${allTimeAgg._count} completed booking${allTimeAgg._count !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Last 30 days"
            value={formatNaira(last30Earned)}
            sub={`${last30Agg._count} booking${last30Agg._count !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="This month"
            value={formatNaira(thisMonthEarned)}
          />
          <StatCard
            label="Pending payout"
            value={formatNaira(pendingTotal)}
            sub={pendingTotal > 0 ? 'Processing within 24h' : 'Nothing pending'}
          />
        </div>

        {/* Pending payouts */}
        {pendingPayouts.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">Pending payouts</h2>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 divide-y divide-amber-100">
              {pendingPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {payout.booking.space?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(payout.booking.startTime).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatNaira(payout.amountKobo)}</p>
                    <span className="text-xs text-amber-700 font-medium capitalize">{payout.status.toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent bookings table */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Recent bookings</h2>
          {recentBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
              <p className="text-3xl mb-3" aria-hidden="true">💰</p>
              <p className="text-sm text-muted-foreground">No completed bookings yet. Once artisans book and complete sessions, your earnings appear here.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-xs text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Space</th>
                      <th className="px-5 py-3 text-left font-medium">Artisan</th>
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-right font-medium">Payout</th>
                      <th className="px-5 py-3 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {recentBookings.map((booking) => {
                      const payoutStatus = booking.payout?.status ?? 'PENDING';
                      const statusColor =
                        payoutStatus === 'PAID' ? 'text-green-700' :
                        payoutStatus === 'PROCESSING' ? 'text-amber-700' :
                        payoutStatus === 'FAILED' ? 'text-red-600' :
                        'text-muted-foreground';

                      return (
                        <tr key={booking.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground">{booking.space?.name}</p>
                            <p className="text-xs text-muted-foreground">{booking.space?.neighborhood}</p>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {booking.artisan?.fullName}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {new Date(booking.startTime).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short',
                            })}
                            {' '}·{' '}
                            {new Date(booking.startTime).toLocaleTimeString('en-NG', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                            {formatNaira(booking.ownerPayoutKobo)}
                          </td>
                          <td className={`px-5 py-3.5 text-right text-xs font-medium capitalize ${statusColor}`}>
                            {payoutStatus.toLowerCase()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Commission explanation */}
        <div className="rounded-2xl bg-white border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">How payouts work</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SpaceLY charges a 15% platform commission on each booking. You receive 85% of the booking amount,
            paid out within 24 hours of session completion. Security deposits are returned to artisans after
            a 48-hour dispute window. Payouts are processed via your registered bank account.
          </p>
        </div>
      </main>
    </div>
  );
}
