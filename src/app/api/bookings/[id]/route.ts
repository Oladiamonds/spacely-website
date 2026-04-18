import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/bookings/[id] — fetch a single booking (artisan or owner only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      space: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          neighborhood: true,
          city: true,
          type: true,
          ownerId: true,
          photos: { where: { isHero: true }, select: { cloudinaryUrl: true }, take: 1 },
        },
      },
      artisan: {
        select: { id: true, fullName: true, avatarUrl: true, phone: true },
      },
      review: { select: { id: true, rating: true, comment: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  // Only artisan or space owner may view
  const isArtisan = booking.artisanId === user.id;
  const isOwner = booking.space?.ownerId === user.id;
  if (!isArtisan && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Flatten heroPhoto onto space for convenience
  const { space, ...rest } = booking;
  const result = {
    ...rest,
    space: space
      ? {
          ...space,
          heroPhoto: space.photos[0]?.cloudinaryUrl ?? null,
          photos: undefined,
        }
      : null,
  };

  return NextResponse.json(result);
}
