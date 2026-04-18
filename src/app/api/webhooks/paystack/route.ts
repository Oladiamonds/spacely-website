import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import {
  sendBookingConfirmation,
  sendOwnerBookingAlert,
  sendPayoutNotification,
} from '@/lib/termii';

// Paystack sends webhooks to this endpoint for payment events.
// IMPORTANT: This route must NOT be protected by middleware auth checks.

export async function POST(request: NextRequest) {
  // 1. Read raw body as text for HMAC verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';

  // 2. Verify signature — reject anything that doesn't match
  let signatureValid: boolean;
  try {
    signatureValid = verifyWebhookSignature(rawBody, signature);
  } catch {
    // timingSafeEqual throws if buffers differ in length — treat as invalid
    signatureValid = false;
  }

  if (!signatureValid) {
    console.warn('[webhook/paystack] Invalid signature — rejected');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3. Handle events
  try {
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;

      case 'charge.failed':
      case 'charge.reversed':
        await handleChargeFailed(event.data);
        break;

      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;

      case 'transfer.failed':
      case 'transfer.reversed':
        await handleTransferFailed(event.data);
        break;

      default:
        // Acknowledge unknown events without error so Paystack stops retrying
        break;
    }
  } catch (error) {
    console.error(`[webhook/paystack] Error handling ${event.event}:`, error);
    // Return 500 so Paystack retries
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;
  const metadata = (data.metadata as Record<string, string>) ?? {};

  const booking = await prisma.booking.findFirst({
    where: { paystackReference: reference },
    include: {
      space: {
        select: {
          name: true,
          address: true,
          neighborhood: true,
          owner: { select: { phone: true, fullName: true } },
        },
      },
      artisan: {
        select: { phone: true, fullName: true, email: true },
      },
    },
  });

  if (!booking) {
    console.warn(`[webhook/paystack] No booking found for reference: ${reference}`);
    return;
  }

  if (booking.status === 'CONFIRMED') {
    // Already processed (Paystack may retry)
    return;
  }

  // Confirm the booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CONFIRMED',
      paidAt: new Date(),
      heldUntil: null,
    },
  });

  // Send SMS notifications (fire-and-forget — don't let SMS failure block the response)
  const artisanPhone = booking.artisan?.phone;
  const ownerPhone = booking.space?.owner.phone;

  if (artisanPhone) {
    sendBookingConfirmation({
      phone: artisanPhone,
      artisanName: booking.artisan?.fullName ?? 'there',
      spaceName: booking.space?.name ?? 'your space',
      address: `${booking.space?.address}, ${booking.space?.neighborhood}`,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmountNaira: booking.totalAmountKobo / 100,
    }).catch((err) => console.error('[SMS] artisan confirmation failed:', err));
  }

  if (ownerPhone) {
    sendOwnerBookingAlert({
      phone: ownerPhone,
      ownerName: booking.space?.owner.fullName ?? 'Owner',
      spaceName: booking.space?.name ?? 'your space',
      artisanName: booking.artisan?.fullName ?? 'An artisan',
      startTime: booking.startTime,
      endTime: booking.endTime,
      payoutNaira: booking.ownerPayoutKobo / 100,
    }).catch((err) => console.error('[SMS] owner alert failed:', err));
  }
}

async function handleChargeFailed(data: Record<string, unknown>) {
  const reference = data.reference as string;

  // Release the held slot so other users can book
  await prisma.booking.updateMany({
    where: { paystackReference: reference, status: 'HELD' },
    data: { status: 'CANCELLED' },
  });
}

async function handleTransferSuccess(data: Record<string, unknown>) {
  const transferCode = data.transfer_code as string;

  // Find the payout record by transfer code
  const payout = await prisma.payout.findFirst({
    where: { paystackTransferCode: transferCode },
    include: {
      owner: { select: { phone: true, fullName: true } },
    },
  });

  if (!payout) return;

  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: 'PAID', processedAt: new Date() },
  });

  if (payout.owner?.phone) {
    sendPayoutNotification({
      phone: payout.owner.phone,
      ownerName: payout.owner.fullName,
      amountNaira: payout.amountKobo / 100,
    }).catch((err) => console.error('[SMS] payout notification failed:', err));
  }
}

async function handleTransferFailed(data: Record<string, unknown>) {
  const transferCode = data.transfer_code as string;

  await prisma.payout.updateMany({
    where: { paystackTransferCode: transferCode, status: 'PROCESSING' },
    data: { status: 'FAILED' },
  });
}
