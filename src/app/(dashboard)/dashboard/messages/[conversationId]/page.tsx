import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { MessageThread } from '@/components/messaging/MessageThread';

// AES-256-GCM decryption — mirrors /api/messages/route.ts
import crypto from 'crypto';

function decrypt(ciphertext: string): string {
  try {
    const key = process.env.MESSAGE_ENCRYPTION_KEY;
    if (!key || key.length < 32) return ciphertext;

    const encKey = Buffer.from(key.slice(0, 32), 'utf8');
    const [ivHex, tagHex, encHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !encHex) return '[message]';

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc).toString('utf8') + decipher.final('utf8');
  } catch {
    return '[encrypted message]';
  }
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/messages');

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      artisan: { select: { id: true, fullName: true, avatarUrl: true } },
      owner: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          spaces: { select: { name: true }, take: 1 },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) notFound();

  // Access guard: user must be artisan or owner in this conversation
  if (conversation.artisanId !== user.id && conversation.ownerId !== user.id) {
    redirect('/dashboard/messages');
  }

  // Mark unread messages as read (fire-and-forget)
  prisma.message
    .updateMany({
      where: { conversationId, recipientId: user.id, isRead: false },
      data: { isRead: true },
    })
    .catch(() => {});

  const isArtisan = conversation.artisanId === user.id;
  const other = isArtisan ? conversation.owner : conversation.artisan;

  const messages = conversation.messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    content: decrypt(m.contentEncrypted),
    createdAt: m.createdAt.toISOString(),
    isRead: m.isRead,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard/messages" className="text-muted-foreground hover:text-foreground">
            ←
          </Link>
          <div>
            <p className="text-sm font-semibold text-foreground">{other?.fullName}</p>
            {!isArtisan && (
              <p className="text-xs text-muted-foreground">{conversation.owner?.spaces[0]?.name}</p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-3xl flex flex-col">
        <MessageThread
          conversationId={conversationId}
          currentUserId={user.id}
          otherUserId={other?.id ?? ''}
          otherUserName={other?.fullName ?? 'User'}
          otherUserAvatar={other?.avatarUrl}
          initialMessages={messages}
        />
      </div>
    </div>
  );
}
