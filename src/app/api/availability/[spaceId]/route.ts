import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/availability/[spaceId]?date=2026-04-14
 * Returns available hourly slots for a given date.
 * Used by the booking calendar to show green/red time blocks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  const { spaceId } = await params;
  const dateParam = request.nextUrl.searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: 'date query param required (YYYY-MM-DD)' }, { status: 400 });
  }

  const targetDate = new Date(dateParam);
  if (isNaN(targetDate.getTime()))
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });

  // Must be today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (targetDate < today)
    return NextResponse.json({ error: 'Date must not be in the past' }, { status: 400 });

  const dayOfWeek = targetDate.getDay(); // 0=Sun

  const [space, availabilitySlot, blockedDate, existingBookings] = await Promise.all([
    prisma.space.findUnique({
      where: { id: spaceId, status: 'LIVE' },
      select: { minBookingHours: true, pricePerHourKobo: true },
    }),
    prisma.availabilitySlot.findFirst({
      where: { spaceId, dayOfWeek, isAvailable: true },
    }),
    prisma.blockedDate.findFirst({
      where: {
        spaceId,
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
    }),
    // Find all active bookings on this date
    prisma.booking.findMany({
      where: {
        spaceId,
        status: { in: ['HELD', 'CONFIRMED'] },
        startTime: {
          gte: new Date(`${dateParam}T00:00:00.000Z`),
          lt: new Date(`${dateParam}T23:59:59.999Z`),
        },
      },
      select: { startTime: true, endTime: true, heldUntil: true, status: true },
    }),
  ]);

  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

  // Space closed on this day
  if (!availabilitySlot || blockedDate) {
    return NextResponse.json({ available: false, slots: [] });
  }

  // Build hourly slots between openTime and closeTime
  const [openH] = availabilitySlot.openTime.split(':').map(Number);
  const [closeH] = availabilitySlot.closeTime.split(':').map(Number);

  const slots: Array<{ hour: number; label: string; available: boolean; bookedUntilHour?: number }> = [];

  for (let h = openH; h < closeH; h++) {
    const slotStart = new Date(`${dateParam}T${String(h).padStart(2, '0')}:00:00.000Z`);
    const slotEnd = new Date(`${dateParam}T${String(h + 1).padStart(2, '0')}:00:00.000Z`);

    // Check if this hour overlaps any active booking
    const booking = existingBookings.find((b) => {
      // Expire stale HELD bookings
      if (b.status === 'HELD' && b.heldUntil && b.heldUntil < new Date()) return false;
      return b.startTime < slotEnd && b.endTime > slotStart;
    });

    slots.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      available: !booking,
      bookedUntilHour: booking ? new Date(booking.endTime).getHours() : undefined,
    });
  }

  return NextResponse.json({
    available: true,
    date: dateParam,
    dayOfWeek,
    openTime: availabilitySlot.openTime,
    closeTime: availabilitySlot.closeTime,
    minBookingHours: space.minBookingHours,
    pricePerHourKobo: space.pricePerHourKobo,
    slots,
  });
}

/**
 * PUT /api/availability/[spaceId] — Owner sets weekly availability
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  const { spaceId } = await params;

  let body: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isAvailable: boolean }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Replace all slots in a transaction
  await prisma.$transaction([
    prisma.availabilitySlot.deleteMany({ where: { spaceId } }),
    prisma.availabilitySlot.createMany({
      data: body.map((slot) => ({
        spaceId,
        dayOfWeek: slot.dayOfWeek,
        openTime: slot.openTime,
        closeTime: slot.closeTime,
        isAvailable: slot.isAvailable,
      })),
    }),
  ]);

  return NextResponse.json({ updated: true });
}
