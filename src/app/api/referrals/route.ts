import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

const REFERRAL_CREDIT_KOBO = 500_000; // ₦5,000 credit for referrer
const REFEREE_CREDIT_KOBO = 250_000;  // ₦2,500 credit for new user

// ─────────────────────────────────────────────────────────────
// GET /api/referrals — Get referral code + stats
// ─────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true },
  });

  // Deterministic referral code from user ID
  const referralCode = `SLY${user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const [referrals, wallet] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: user.id },
      select: { id: true, isClaimed: true, claimedAt: true, createdAt: true },
    }),
    prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balanceKobo: true },
    }),
  ]);

  const totalEarnedKobo = referrals.filter((r) => r.isClaimed).length * REFERRAL_CREDIT_KOBO;

  return NextResponse.json({
    referralCode,
    referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
    totalReferrals: referrals.length,
    claimedReferrals: referrals.filter((r) => r.isClaimed).length,
    totalEarnedKobo,
    totalEarnedNaira: totalEarnedKobo / 100,
    walletBalanceKobo: wallet?.balanceKobo ?? 0,
    rewardPerReferralNaira: REFERRAL_CREDIT_KOBO / 100,
    refereeRewardNaira: REFEREE_CREDIT_KOBO / 100,
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/referrals/claim — Claim a referral code at signup
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { referralCode: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { referralCode } = body;
  if (!referralCode) return NextResponse.json({ error: 'referralCode required' }, { status: 400 });

  // Decode referrer ID from code
  const codePrefix = referralCode.replace('SLY', '').toLowerCase();

  const referrer = await prisma.user.findFirst({
    where: {
      id: { startsWith: codePrefix.slice(0, 8) },
    },
    select: { id: true },
  });

  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  if (referrer.id === user.id)
    return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });

  // Check if already claimed
  const existing = await prisma.referral.findFirst({
    where: { referredId: user.id },
  });
  if (existing) return NextResponse.json({ error: 'You have already used a referral code' }, { status: 409 });

  // Create referral + credit both wallets in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: user.id,
        referralCode,
        creditAmountKobo: REFERRAL_CREDIT_KOBO,
        isClaimed: true,
        claimedAt: new Date(),
      },
    });

    // Credit referrer wallet
    await tx.wallet.upsert({
      where: { userId: referrer.id },
      create: {
        userId: referrer.id,
        balanceKobo: REFERRAL_CREDIT_KOBO,
        totalToppedUpKobo: REFERRAL_CREDIT_KOBO,
      },
      update: {
        balanceKobo: { increment: REFERRAL_CREDIT_KOBO },
        totalToppedUpKobo: { increment: REFERRAL_CREDIT_KOBO },
      },
    });

    // Credit referee wallet
    await tx.wallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        balanceKobo: REFEREE_CREDIT_KOBO,
        totalToppedUpKobo: REFEREE_CREDIT_KOBO,
      },
      update: {
        balanceKobo: { increment: REFEREE_CREDIT_KOBO },
        totalToppedUpKobo: { increment: REFEREE_CREDIT_KOBO },
      },
    });
  });

  return NextResponse.json({
    success: true,
    yourCreditNaira: REFEREE_CREDIT_KOBO / 100,
    message: `₦${REFEREE_CREDIT_KOBO / 100} has been added to your wallet!`,
  });
}
