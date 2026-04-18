import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────
// GET /api/users/me — current user's full profile
// ─────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      trustScore: true,
      phoneVerified: true,
      ninVerified: true,
      bvnVerified: true,
      instagramHandle: true,
      portfolioUrl: true,
      subscriptionPlan: true,
      subscriptionEnds: true,
      paystackSubaccountCode: true,
      bankAccountName: true,
      bankCode: true,
      // NOTE: bankAccountNumber is AES-256 encrypted — do not expose raw value
      wallet: { select: { balanceKobo: true } },
      createdAt: true,
    },
  });

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(profile);
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/me — update profile fields
// ─────────────────────────────────────────────────────────────

const ALLOWED_FIELDS = new Set([
  'fullName',
  'instagramHandle',
  'portfolioUrl',
  'avatarUrl',
]);

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Whitelist update fields — prevent role escalation and other sensitive mutations
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = typeof value === 'string' ? value.trim() || null : value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updates,
    select: { id: true, fullName: true, avatarUrl: true, instagramHandle: true, portfolioUrl: true },
  });

  return NextResponse.json(updated);
}
