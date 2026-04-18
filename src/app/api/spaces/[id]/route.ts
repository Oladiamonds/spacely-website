import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────
// GET /api/spaces/[id] — Space detail (id OR slug)
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Support both UUID and slug lookup
    // NOTE: status filter removed here so owners can fetch their own DRAFT/PENDING spaces.
    // Public space pages should check status === 'LIVE' before rendering.
    const space = await prisma.space.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            trustScore: true,
            ninVerified: true,
          },
        },
        photos: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            cloudinaryUrl: true,
            cloudinaryId: true,
            altText: true,
            order: true,
            isHero: true,
          },
        },
        tools: {
          orderBy: { category: 'asc' },
          select: {
            id: true,
            name: true,
            category: true,
            brand: true,
            model: true,
            quantity: true,
            notes: true,
          },
        },
        availability: {
          orderBy: { dayOfWeek: 'asc' },
          select: {
            dayOfWeek: true,
            openTime: true,
            closeTime: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    return NextResponse.json(space);
  } catch (error) {
    console.error('[GET /api/spaces/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch space' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/spaces/[id] — Update listing (owner only)
// ─────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const space = await prisma.space.findUnique({
    where: { id },
    select: { ownerId: true, status: true },
  });

  if (!space) {
    return NextResponse.json({ error: 'Space not found' }, { status: 404 });
  }

  if (space.ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cannot edit a suspended space
  if (space.status === 'SUSPENDED') {
    return NextResponse.json(
      { error: 'Suspended spaces cannot be edited' },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Whitelist editable fields
  const allowedFields = [
    'name', 'description', 'houseRules', 'address', 'neighborhood',
    'pricePerHourKobo', 'securityDepositKobo', 'minBookingHours',
    'maxCapacity', 'latitude', 'longitude',
  ];

  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updateData[key] = body[key];
  }

  // When owner submits for review after completing draft
  if (body.submitForReview === true && space.status === 'DRAFT') {
    updateData.status = 'PENDING_REVIEW';
  }

  // Hero photo update — set new hero and demote previous
  if (typeof body.heroPhotoId === 'string') {
    const photo = await prisma.spacePhoto.findFirst({
      where: { id: body.heroPhotoId, spaceId: id },
    });
    if (photo) {
      await prisma.spacePhoto.updateMany({ where: { spaceId: id, isHero: true }, data: { isHero: false } });
      await prisma.spacePhoto.update({ where: { id: body.heroPhotoId }, data: { isHero: true } });
    }
    // Return early after hero update if that's the only change
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ id, heroUpdated: true });
    }
  }

  try {
    // Availability update — replace entire weekly schedule atomically
    if (Array.isArray(body.availability) && body.availability.length > 0) {
      const slots = body.availability as Array<{
        dayOfWeek: number;
        isAvailable: boolean;
        openTime: string;
        closeTime: string;
      }>;

      await prisma.$transaction([
        prisma.availabilitySlot.deleteMany({ where: { spaceId: id } }),
        prisma.availabilitySlot.createMany({
          data: slots.map((s) => ({
            spaceId: id,
            dayOfWeek: s.dayOfWeek,
            isAvailable: s.isAvailable,
            openTime: s.openTime,
            closeTime: s.closeTime,
          })),
        }),
      ]);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ id, updated: true });
    }

    const updated = await prisma.space.update({
      where: { id },
      data: updateData,
      select: { id: true, slug: true, status: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/spaces/[id]]', error);
    return NextResponse.json({ error: 'Failed to update space' }, { status: 500 });
  }
}
