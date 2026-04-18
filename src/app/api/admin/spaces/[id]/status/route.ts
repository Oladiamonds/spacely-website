import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { SpaceStatus } from '@/types';

const ALLOWED_TRANSITIONS: Record<SpaceStatus, SpaceStatus[]> = {
  DRAFT:          [],
  PENDING_REVIEW: ['LIVE', 'SUSPENDED'],
  LIVE:           ['PAUSED', 'SUSPENDED'],
  PAUSED:         ['LIVE', 'SUSPENDED'],
  SUSPENDED:      ['LIVE'],
};

// PATCH /api/admin/spaces/[id]/status — approve, suspend, or toggle space status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { status: SpaceStatus; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status: newStatus, reason } = body;

  const space = await prisma.space.findUnique({
    where: { id },
    select: { id: true, status: true, name: true },
  });
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

  const currentStatus = space.status as SpaceStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentStatus} to ${newStatus}` },
      { status: 400 },
    );
  }

  const updated = await prisma.space.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === 'LIVE' && { isSpacelyVerified: true, verifiedAt: new Date() }),
    },
    select: { id: true, name: true, status: true },
  });

  // TODO: Send notification to space owner via Termii when going LIVE or SUSPENDED

  return NextResponse.json(updated);
}
