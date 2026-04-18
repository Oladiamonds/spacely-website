import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createSubaccount, listBanks, resolveAccountNumber } from '@/lib/paystack';

// GET /api/owner/subaccount — list supported Nigerian banks
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const banks = await listBanks();
  return NextResponse.json({ banks });
}

// POST /api/owner/subaccount — create Paystack subaccount + save bank details
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, fullName: true, email: true, paystackSubaccountCode: true },
  });
  if (dbUser?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only space owners can set up payouts' }, { status: 403 });
  }
  if (dbUser?.paystackSubaccountCode) {
    return NextResponse.json({ error: 'Payout account already set up. Contact support to update.' }, { status: 409 });
  }

  let body: { bankCode: string; accountNumber: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { bankCode, accountNumber } = body;
  if (!bankCode || !accountNumber) {
    return NextResponse.json({ error: 'bankCode and accountNumber are required' }, { status: 400 });
  }
  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 });
  }

  // Resolve account name via Paystack
  let accountName: string;
  try {
    const resolved = await resolveAccountNumber(accountNumber, bankCode);
    accountName = resolved.accountName;
  } catch {
    return NextResponse.json(
      { error: 'Could not verify account. Check your account number and bank.' },
      { status: 422 },
    );
  }

  // Create Paystack subaccount (15% goes to SpaceLY, 85% to owner)
  const subaccount = await createSubaccount({
    businessName: dbUser.fullName,
    settlementBank: bankCode,
    accountNumber,
    percentageCharge: 15,
    description: `SpaceLY owner: ${dbUser.fullName}`,
  });

  // Persist (account number stored as-is; encrypt in production via a KMS)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      paystackSubaccountCode: subaccount.subaccountCode,
      bankCode,
      bankAccountNumber: accountNumber,
      bankAccountName: accountName,
    },
  });

  return NextResponse.json({
    subaccountCode: subaccount.subaccountCode,
    accountName,
    bankCode,
  }, { status: 201 });
}
