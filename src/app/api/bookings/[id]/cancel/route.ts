import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendCancellationNotice } from '@/lib/termii';

const REFUND_TIERS = [
  { hoursMin: 24, refundPct: 100 },
  { hoursMin: 12, refundPct: 50 },
  { hoursMin: 0,  refundPct: 0 },
] as const;

function getRefundPercent(startTime: Date): number {
  const hoursUntil = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);
  for (const tier of REFUND_TIERS) {
    if (hoursUntil >= tier.hoursMin) return tier.refundPct;
  }
  return 0;
}

export async function POST(
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
      artisan: { select: { phone: true, fullName: true } },
      space: { select: { name: true, ownerId: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.artisanId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!['HELD', 'CONFIRMED'].includes(booking.status))
    return NextResponse.json({ error: `Cannot cancel a ${booking.status} booking` }, { status: 400 });

  const refundPct = getRefundPercent(booking.startTime);
  const refundKobo = Math.round(booking.totalAmountKobo * refundPct / 100);

  // Initiate Paystack refund if payment was made
  if (refundKobo > 0 && booking.paidAt && booking.paystackReference) {
    try {
      const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: booking.paystackReference,
          amount: refundKobo,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('[cancel] Paystack refund failed:', err);
      }
    } catch (err) {
      console.error('[cancel] Paystack refund error:', err);
    }
  }

  await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  if (booking.artisan?.phone) {
    sendCancellationNotice({
      phone: booking.artisan.phone,
      artisanName: booking.artisan.fullName,
      spaceName: booking.space?.name ?? 'the space',
      refundNaira: refundKobo > 0 ? refundKobo / 100 : undefined,
    }).catch(() => {});
  }

  return NextResponse.json({
    cancelled: true,
    refundPct,
    refundKobo,
    refundNaira: refundKobo / 100,
    message:
      refundPct === 100
        ? 'Full refund will be processed within 3–5 business days.'
        : refundPct === 50
        ? '50% refund will be processed within 3–5 business days.'
        : 'No refund applies for cancellations within 12 hours of start time.',
  });
}
