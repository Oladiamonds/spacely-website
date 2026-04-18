import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types';

const ROLE_STYLES: Record<UserRole, string> = {
  ARTISAN: 'bg-blue-50 text-blue-700',
  OWNER:   'bg-purple-50 text-purple-700',
  ADMIN:   'bg-red-50 text-red-600',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/users');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== 'ADMIN') redirect('/dashboard');

  const sp = await searchParams;
  const roleFilter = sp.role ?? 'all';
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const search = sp.q?.trim() ?? '';
  const limit = 25;
  const skip = (page - 1) * limit;

  const where = {
    ...(roleFilter !== 'all' && { role: roleFilter as UserRole }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        ninVerified: true,
        trustScore: true,
        createdAt: true,
        _count: { select: { spaces: true, bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const ROLES = ['all', 'ARTISAN', 'OWNER', 'ADMIN'] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 uppercase tracking-wide">Admin</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/admin/spaces" className="hover:text-foreground">Spaces</Link>
            <span className="text-foreground font-medium">Users</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">User management</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} user{total !== 1 ? 's' : ''}{roleFilter !== 'all' ? ` · ${roleFilter.toLowerCase()}s` : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {ROLES.map((r) => (
              <Link
                key={r}
                href={`/admin/users?role=${r}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  roleFilter === r
                    ? 'bg-foreground text-background'
                    : 'bg-white border border-neutral-200 text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'all' ? 'All roles' : r}
              </Link>
            ))}
          </div>

          {/* Search */}
          <form method="GET" action="/admin/users" className="flex gap-2 ml-auto">
            <input type="hidden" name="role" value={roleFilter} />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search name, phone, email…"
              className="h-9 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-56"
            />
            <button
              type="submit"
              className="h-9 rounded-xl bg-foreground px-4 text-xs font-semibold text-background"
            >
              Search
            </button>
          </form>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-16 text-center">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-sm text-muted-foreground">No users match this filter.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">User</th>
                    <th className="px-5 py-3 text-left font-medium">Phone</th>
                    <th className="px-5 py-3 text-center font-medium">Role</th>
                    <th className="px-5 py-3 text-center font-medium">NIN</th>
                    <th className="px-5 py-3 text-center font-medium">Trust</th>
                    <th className="px-5 py-3 text-center font-medium">Spaces</th>
                    <th className="px-5 py-3 text-center font-medium">Bookings</th>
                    <th className="px-5 py-3 text-left font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">{u.fullName}</p>
                        {u.email && (
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                        {u.phone}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLES[u.role as UserRole]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {u.ninVerified ? (
                          <span className="text-green-600 text-sm">✓</span>
                        ) : (
                          <span className="text-neutral-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center text-sm font-medium text-foreground">
                        {u.trustScore}
                      </td>
                      <td className="px-5 py-3.5 text-center text-muted-foreground">
                        {u._count.spaces}
                      </td>
                      <td className="px-5 py-3.5 text-center text-muted-foreground">
                        {u._count.bookings}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
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
                <Link
                  href={`/admin/users?role=${roleFilter}&page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                  className="rounded-xl border border-neutral-200 px-4 py-2 hover:bg-neutral-50"
                >
                  ← Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/users?role=${roleFilter}&page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                  className="rounded-xl border border-neutral-200 px-4 py-2 hover:bg-neutral-50"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
