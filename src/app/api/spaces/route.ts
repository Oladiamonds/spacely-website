import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { SpaceSearchParams, CreateSpaceInput } from '@/types';

// ─────────────────────────────────────────────────────────────
// GET /api/spaces — Search spaces
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: SpaceSearchParams = {
    city: searchParams.get('city') ?? undefined,
    neighborhood: searchParams.get('neighborhood') ?? undefined,
    type: (searchParams.get('type') as SpaceSearchParams['type']) ?? undefined,
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    radiusKm: searchParams.get('radiusKm') ? parseFloat(searchParams.get('radiusKm')!) : 10,
    minPriceKobo: searchParams.get('minPriceKobo') ? parseInt(searchParams.get('minPriceKobo')!) : undefined,
    maxPriceKobo: searchParams.get('maxPriceKobo') ? parseInt(searchParams.get('maxPriceKobo')!) : undefined,
    date: searchParams.get('date') ?? undefined,
    hours: searchParams.get('hours') ? parseInt(searchParams.get('hours')!) : undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!), 50) : 20,
  };

  const skip = ((params.page ?? 1) - 1) * (params.limit ?? 20);

  try {
    // Use raw query for PostGIS geo search when lat/lng provided
    if (params.lat && params.lng) {
      const radiusMeters = (params.radiusKm ?? 10) * 1000;

      // Build optional filter fragments — Prisma.empty is a no-op fragment
      const typeFilter = params.type
        ? Prisma.sql`AND s.type = ${params.type}::"SpaceType"`
        : Prisma.empty;
      const minPriceFilter = params.minPriceKobo
        ? Prisma.sql`AND s.price_per_hour_kobo >= ${params.minPriceKobo}`
        : Prisma.empty;
      const maxPriceFilter = params.maxPriceKobo
        ? Prisma.sql`AND s.price_per_hour_kobo <= ${params.maxPriceKobo}`
        : Prisma.empty;

      const spaces = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          slug: string;
          type: string;
          neighborhood: string;
          city: string;
          price_per_hour_kobo: number;
          average_rating: number | null;
          total_reviews: number;
          is_spacely_verified: boolean;
          hero_photo: string | null;
          distance_m: number;
        }>
      >`
        SELECT
          s.id,
          s.name,
          s.slug,
          s.type,
          s.neighborhood,
          s.city,
          s.price_per_hour_kobo,
          s.average_rating,
          s.total_reviews,
          s.is_spacely_verified,
          (SELECT p.cloudinary_url FROM space_photos p WHERE p.space_id = s.id AND p.is_hero = true LIMIT 1) AS hero_photo,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography
          ) AS distance_m
        FROM spaces s
        WHERE
          s.status = 'LIVE'
          ${typeFilter}
          ${minPriceFilter}
          ${maxPriceFilter}
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography,
            ${radiusMeters}
          )
        ORDER BY distance_m ASC
        LIMIT ${params.limit ?? 20}
        OFFSET ${skip}
      `;

      return NextResponse.json({
        spaces: spaces.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          type: s.type,
          neighborhood: s.neighborhood,
          city: s.city,
          pricePerHourKobo: s.price_per_hour_kobo,
          averageRating: s.average_rating,
          totalReviews: s.total_reviews,
          isSpacelyVerified: s.is_spacely_verified,
          heroPhoto: s.hero_photo,
          distanceKm: Math.round((s.distance_m / 1000) * 10) / 10,
        })),
        pagination: { page: params.page, limit: params.limit },
      });
    }

    // Standard search (no geo)
    const where: Parameters<typeof prisma.space.findMany>[0]['where'] = {
      status: 'LIVE',
      ...(params.city && { city: { contains: params.city, mode: 'insensitive' } }),
      ...(params.neighborhood && {
        neighborhood: { contains: params.neighborhood, mode: 'insensitive' },
      }),
      ...(params.type && { type: params.type }),
      ...(params.minPriceKobo && { pricePerHourKobo: { gte: params.minPriceKobo } }),
      ...(params.maxPriceKobo && {
        pricePerHourKobo: {
          ...(params.minPriceKobo ? { gte: params.minPriceKobo } : {}),
          lte: params.maxPriceKobo,
        },
      }),
    };

    const [spaces, total] = await Promise.all([
      prisma.space.findMany({
        where,
        skip,
        take: params.limit ?? 20,
        orderBy: [{ isSpacelyVerified: 'desc' }, { averageRating: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          neighborhood: true,
          city: true,
          pricePerHourKobo: true,
          averageRating: true,
          totalReviews: true,
          isSpacelyVerified: true,
          photos: {
            where: { isHero: true },
            select: { cloudinaryUrl: true },
            take: 1,
          },
        },
      }),
      prisma.space.count({ where }),
    ]);

    return NextResponse.json({
      spaces: spaces.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        type: s.type,
        neighborhood: s.neighborhood,
        city: s.city,
        pricePerHourKobo: s.pricePerHourKobo,
        averageRating: s.averageRating,
        totalReviews: s.totalReviews,
        isSpacelyVerified: s.isSpacelyVerified,
        heroPhoto: s.photos[0]?.cloudinaryUrl ?? null,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / (params.limit ?? 20)),
      },
    });
  } catch (error) {
    console.error('[GET /api/spaces]', error);
    return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/spaces — Create listing (owner only)
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify this user is an OWNER in our DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== 'OWNER') {
    return NextResponse.json(
      { error: 'Only space owners can create listings' },
      { status: 403 },
    );
  }

  let body: CreateSpaceInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Basic validation
  if (!body.name || !body.type || !body.description || !body.address || !body.neighborhood) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!body.pricePerHourKobo || body.pricePerHourKobo < 100_000) {
    // Minimum ₦1,000/hour
    return NextResponse.json(
      { error: 'Minimum price is ₦1,000/hour (100,000 kobo)' },
      { status: 400 },
    );
  }

  try {
    // Generate slug from name
    const baseSlug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);

    // Ensure slug uniqueness by appending a short random suffix if needed
    const existingSlug = await prisma.space.findFirst({
      where: { slug: { startsWith: baseSlug } },
      orderBy: { createdAt: 'desc' },
      select: { slug: true },
    });

    const slug = existingSlug
      ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
      : baseSlug;

    const space = await prisma.space.create({
      data: {
        ownerId: user.id,
        name: body.name,
        slug,
        type: body.type,
        description: body.description,
        houseRules: body.houseRules,
        address: body.address,
        city: 'Lagos', // Lagos-first
        state: 'Lagos',
        neighborhood: body.neighborhood,
        latitude: 6.5244, // placeholder — updated when owner sets map pin
        longitude: 3.3792,
        pricePerHourKobo: body.pricePerHourKobo,
        securityDepositKobo: body.securityDepositKobo ?? 0,
        minBookingHours: body.minBookingHours ?? 1,
        status: 'DRAFT',
        commissionRate: 0.15,
        availabilitySlots: body.availability
          ? {
              create: body.availability.map((slot) => ({
                dayOfWeek: slot.dayOfWeek,
                openTime: slot.openTime,
                closeTime: slot.closeTime,
                isAvailable: slot.isAvailable,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        slug: true,
        status: true,
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error('[POST /api/spaces]', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
