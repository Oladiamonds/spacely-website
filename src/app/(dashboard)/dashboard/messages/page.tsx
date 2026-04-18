import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Lightweight messages list — the actual thread is in /dashboard/messages/[conversationId]
export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/messages');

  // Load conversations where current user is artisan or owner
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ artisanId: user.id }, { ownerId: user.id }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      artisan: { select: { id: true, fullName: true, avatarUrl: true } },
      owner: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          spaces: { select: { name: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
            <p className="text-3xl mb-4" aria-hidden="true">💬</p>
            <h3 className="text-base font-semibold text-foreground">No messages yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
              Messages are created when you make a booking. Start by finding a space.
            </p>
            <Link href="/spaces/lagos" className="btn-primary mt-5 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold">
              Find a space →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              // Determine "other" person
              const isArtisan = conv.artisanId === user.id;
              const other = isArtisan ? conv.owner : conv.artisan;
              const otherName = other?.fullName ?? 'Unknown';
              const otherAvatar = other?.avatarUrl;
              const lastMessage = conv.messages[0];
              const spaceName = conv.owner?.spaces[0]?.name;

              const hasUnread = lastMessage
                ? !lastMessage.isRead && lastMessage.senderId !== user.id
                : false;

              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/messages/${conv.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors"
                >
                  <div className="relative shrink-0 h-12 w-12 rounded-full bg-primary/10 overflow-hidden">
                    {otherAvatar ? (
                      <Image src={otherAvatar} alt={otherName} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                        {otherName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm line-clamp-1 ${hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                        {otherName}
                      </p>
                      {lastMessage && (
                        <time className="shrink-0 text-xs text-muted-foreground">
                          {new Date(lastMessage.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short',
                          })}
                        </time>
                      )}
                    </div>
                    {spaceName && (
                      <p className="text-xs text-muted-foreground">{spaceName}</p>
                    )}
                    {lastMessage && (
                      <p className={`mt-0.5 text-xs line-clamp-1 ${hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {lastMessage.senderId === user.id ? 'You: ' : ''}
                        [Encrypted message]
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
