import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { initializeTransaction } from '@/lib/paystack';
import type { CreateBookingInput } from '@/types';

const HOLD_MINUTES = 15; // Slot is reserved for 15 min while user pays

// ─────────────────────────────────────────────────────────────
// GET /api/bookings — List bookings for current user
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? 'artisan'; // 'artisan' | 'owner'
  const tab = searchParams.get('tab'); // 'upcoming' | 'past' | 'all'
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
  const skip = (page - 1) * limit;

  const now = new Date();

  // Tab parameter provides a shortcut for common mobile views
  const tabFilter =
    tab === 'upcoming'
      ? { status: { in: ['HELD', 'CONFIRMED'] as const }, startTime: { gte: now } }
      : tab === 'past'
      ? { status: { in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] as const } }
      : {};

  const where =
    role === 'owner'
      ? { space: { ownerId: user.id }, ...tabFilter }
      : { artisanId: user.id, ...tabFilter };

  try {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
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
              photos: {
                where: { isHero: true },
                select: { cloudinaryUrl: true },
                take: 1,
              },
            },
          },
          artisan: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phone: true,
              trustScore: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/bookings]', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/bookings — Create booking + hold slot
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateBookingInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { spaceId, startTime: startTimeStr, endTime: endTimeStr } = body;

  if (!spaceId || !startTimeStr || !endTimeStr) {
    return NextResponse.json(
      { error: 'spaceId, startTime, and endTime are required' },
      { status: 400 },
    );
  }

  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  if (startTime <= new Date()) {
    return NextResponse.json(
      { error: 'Booking must be in the future' },
      { status: 400 },
    );
  }

  if (endTime <= startTime) {
    return NextResponse.json(
      { error: 'End time must be after start time' },
      { status: 400 },
    );
  }

  const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  try {
    // Fetch space + verify it's LIVE
    const space = await prisma.space.findUnique({
      where: { id: spaceId, status: 'LIVE' },
      select: {
        id: true,
        name: true,
        pricePerHourKobo: true,
        securityDepositKobo: true,
        minBookingHours: true,
        commissionRate: true,
        ownerId: true,
        owner: { select: { email: true, paystackSubaccountCode: true } },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found or unavailable' }, { status: 404 });
    }

    if (totalHours < space.minBookingHours) {
      return NextResponse.json(
        { error: `Minimum booking is ${space.minBookingHours} hour(s)` },
        { status: 400 },
      );
    }

    // Check for conflicting confirmed/held bookings
    const conflict = await prisma.booking.findFirst({
      where: {
        spaceId,
        status: { in: ['HELD', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
        // Expire stale HELD bookings (older than 15 min)
        NOT: {
          status: 'HELD',
          heldUntil: { lt: new Date() },
        },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked or held' },
        { status: 409 },
      );
    }

    // Calculate amounts
    const bookingAmountKobo = Math.round(space.pricePerHourKobo * totalHours);
    const commissionAmountKobo = Math.round(bookingAmountKobo * space.commissionRate);
    const ownerPayoutKobo = bookingAmountKobo - commissionAmountKobo;
    const totalAmountKobo = bookingAmountKobo + space.securityDepositKobo;

    // Fetch artisan email for Paystack
    const artisan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, fullName: true },
    });

    if (!artisan?.email) {
      return NextResponse.json(
        { error: 'Your account email is required to make a payment' },
        { status: 400 },
      );
    }

    // Create HELD booking
    const reference = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        artisanId: user.id,
        spaceId,
        startTime,
        endTime,
        totalHours,
        pricePerHourKobo: space.pricePerHourKobo,
        bookingAmountKobo,
        securityDepositKobo: space.securityDepositKobo,
        totalAmountKobo,
        commissionAmountKobo,
        ownerPayoutKobo,
        status: 'HELD',
        heldUntil: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
        paystackReference: reference,
      },
      select: { id: true, paystackReference: true, totalAmountKobo: true, heldUntil: true },
    });

    // Initialize Paystack transaction
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/confirm?ref=${reference}`;

    const paystack = await initializeTransaction({
      email: artisan.email,
      amountKobo: totalAmountKobo,
      reference,
      callbackUrl,
      metadata: {
        bookingId: booking.id,
        spaceId,
        artisanId: user.id,
        artisanName: artisan.fullName,
        spaceName: space.name,
      },
      subaccount: space.owner.paystackSubaccountCode ?? undefined,
    });

    return NextResponse.json(
      {
        bookingId: booking.id,
        reference: booking.paystackReference,
        totalAmountKobo: booking.totalAmountKobo,
        heldUntil: booking.heldUntil,
        paymentUrl: paystack.authorizationUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/bookings]', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
