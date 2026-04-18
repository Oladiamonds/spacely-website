import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/spaces — paginated space list for admin moderation
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'PENDING_REVIEW';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const skip = (page - 1) * limit;

  const where = status === 'all' ? {} : { status: status as Parameters<typeof prisma.space.findMany>[0]['where'] extends { status?: infer S } ? S : never };

  const [spaces, total] = await Promise.all([
    prisma.space.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' }, // oldest first so oldest pending gets reviewed first
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        photos: { where: { isHero: true }, select: { cloudinaryUrl: true }, take: 1 },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
    prisma.space.count({ where }),
  ]);

  return NextResponse.json({
    spaces,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
