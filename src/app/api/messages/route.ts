import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// AES-256-GCM encryption for message content
const ENCRYPTION_KEY = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY ?? '', 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

// ─────────────────────────────────────────────────────────────
// GET /api/messages?bookingId=xxx — Load conversation for a booking
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookingId = request.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({
    where: { bookingId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        },
      },
    },
  });

  if (!conversation) return NextResponse.json({ messages: [], conversationId: null });

  // Only artisan or owner may read
  if (conversation.artisanId !== user.id && conversation.ownerId !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Mark messages as read
  await prisma.message.updateMany({
    where: { conversationId: conversation.id, recipientId: user.id, isRead: false },
    data: { isRead: true },
  });

  const decrypted = conversation.messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    sender: m.sender,
    content: (() => {
      try { return decrypt(m.contentEncrypted); }
      catch { return '[message unavailable]'; }
    })(),
    isRead: m.isRead,
    createdAt: m.createdAt,
    isMine: m.senderId === user.id,
  }));

  return NextResponse.json({ conversationId: conversation.id, messages: decrypted });
}

// ─────────────────────────────────────────────────────────────
// POST /api/messages — Send a message
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { bookingId: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { bookingId, content } = body;

  if (!bookingId || !content?.trim())
    return NextResponse.json({ error: 'bookingId and content are required' }, { status: 400 });
  if (content.length > 2000)
    return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { artisanId: true, spaceId: true, space: { select: { ownerId: true } } },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const isArtisan = booking.artisanId === user.id;
  const isOwner = booking.space?.ownerId === user.id;
  if (!isArtisan && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ownerId = booking.space!.ownerId;
  const artisanId = booking.artisanId;
  const recipientId = isArtisan ? ownerId : artisanId;

  // Upsert conversation
  let conversation = await prisma.conversation.findUnique({ where: { bookingId } });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { bookingId, artisanId, ownerId },
    });
  }

  const encrypted = ENCRYPTION_KEY.length === 32
    ? encrypt(content.trim())
    : content.trim(); // fallback if key not set (dev only)

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      recipientId,
      contentEncrypted: encrypted,
    },
    include: {
      sender: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({
    id: message.id,
    senderId: message.senderId,
    sender: message.sender,
    content: content.trim(),
    isRead: false,
    createdAt: message.createdAt,
    isMine: true,
  }, { status: 201 });
}
