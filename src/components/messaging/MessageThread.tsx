'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Image from 'next/image';

interface Message {
  id: string;
  senderId: string;
  content: string; // Already decrypted by server
  createdAt: string;
  isRead: boolean;
}

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  initialMessages: Message[];
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  initialMessages,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError('');

    startTransition(async () => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          recipientId: otherUserId,
          content: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to send message');
        return;
      }

      // Optimistically add to thread
      setMessages((prev) => [
        ...prev,
        {
          id: data.id ?? crypto.randomUUID(),
          senderId: currentUserId,
          content: trimmed,
          createdAt: new Date().toISOString(),
          isRead: false,
        },
      ]);
      setText('');

      // Auto-resize textarea back
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    });
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) {
      last.messages.push(msg);
    } else {
      grouped.push({ date, messages: [msg] });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <p className="text-3xl mb-3" aria-hidden="true">💬</p>
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello to {otherUserName}!
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border-t border-neutral-100" />
                <span className="text-xs text-muted-foreground font-medium">{group.date}</span>
                <div className="flex-1 border-t border-neutral-100" />
              </div>
              <div className="space-y-2">
                {group.messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isOwn && (
                        <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 overflow-hidden">
                          {otherUserAvatar ? (
                            <Image src={otherUserAvatar} alt={otherUserName} width={28} height={28} className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                              {otherUserName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[72%] group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-primary text-white rounded-br-sm'
                              : 'bg-white border border-neutral-200 text-foreground rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <time className="mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTime(msg.createdAt)}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-neutral-100 px-4 py-3">
        {error && (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={1000}
            placeholder={`Message ${otherUserName}…`}
            disabled={isPending}
            className="flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 min-h-[44px]"
            style={{ height: 'auto' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary/90"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-right text-[10px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
