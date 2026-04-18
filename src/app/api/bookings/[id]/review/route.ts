import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      artisanId: true,
      spaceId: true,
      status: true,
      endTime: true,
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.artisanId !== user.id)
    return NextResponse.json({ error: 'Only the artisan who made the booking can leave a review' }, { status: 403 });
  if (booking.status !== 'COMPLETED')
    return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });

  // Check 7-day review window
  const daysSinceEnd = (Date.now() - booking.endTime.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceEnd > 7)
    return NextResponse.json({ error: 'Review window has closed (7 days after session end)' }, { status: 400 });

  // Prevent duplicate review
  const existing = await prisma.review.findFirst({
    where: { bookingId, reviewerId: user.id },
  });
  if (existing) return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 409 });

  let body: {
    rating: number;
    comment?: string;
    spaceQualityRating?: number;
    equipmentRating?: number;
    accuracyRating?: number;
    valueRating?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.rating || body.rating < 1 || body.rating > 5)
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });

  const review = await prisma.review.create({
    data: {
      bookingId,
      reviewerId: user.id,
      spaceId: booking.spaceId,
      rating: Math.round(body.rating),
      comment: body.comment,
      spaceQualityRating: body.spaceQualityRating ? Math.round(body.spaceQualityRating) : undefined,
      equipmentRating: body.equipmentRating ? Math.round(body.equipmentRating) : undefined,
      accuracyRating: body.accuracyRating ? Math.round(body.accuracyRating) : undefined,
      valueRating: body.valueRating ? Math.round(body.valueRating) : undefined,
      isPublished: true,
      editableUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h edit window
    },
  });

  // Update space average rating (denormalized)
  const stats = await prisma.review.aggregate({
    where: { spaceId: booking.spaceId, isPublished: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.space.update({
    where: { id: booking.spaceId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
