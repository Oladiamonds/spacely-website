import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { initializeTransaction } from '@/lib/paystack';
import { formatNaira } from '@/types';

// ─────────────────────────────────────────────────────────────
// GET /api/wallet — Fetch wallet balance
// ─────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    // Auto-create wallet on first access
    const created = await prisma.wallet.create({
      data: { userId: user.id },
    });
    return NextResponse.json({
      balanceKobo: created.balanceKobo,
      balanceNaira: created.balanceKobo / 100,
      balanceFormatted: formatNaira(created.balanceKobo),
      totalToppedUpKobo: created.totalToppedUpKobo,
      totalSpentKobo: created.totalSpentKobo,
    });
  }

  return NextResponse.json({
    balanceKobo: wallet.balanceKobo,
    balanceNaira: wallet.balanceKobo / 100,
    balanceFormatted: formatNaira(wallet.balanceKobo),
    totalToppedUpKobo: wallet.totalToppedUpKobo,
    totalSpentKobo: wallet.totalSpentKobo,
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/wallet — Top up wallet
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { amountKobo: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { amountKobo } = body;

  // Min top-up: ₦1,000 | Max top-up: ₦500,000
  if (!amountKobo || amountKobo < 100_000 || amountKobo > 50_000_000)
    return NextResponse.json(
      { error: 'Amount must be between ₦1,000 and ₦500,000' },
      { status: 400 },
    );

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, fullName: true },
  });

  if (!dbUser?.email)
    return NextResponse.json({ error: 'Email required to top up wallet' }, { status: 400 });

  const reference = `WAL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const paystack = await initializeTransaction({
    email: dbUser.email,
    amountKobo,
    reference,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?ref=${reference}`,
    metadata: {
      type: 'wallet_topup',
      userId: user.id,
      amountKobo,
    },
  });

  return NextResponse.json({
    paymentUrl: paystack.authorizationUrl,
    reference,
    amountKobo,
    amountFormatted: formatNaira(amountKobo),
  });
}
