import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export default async function VerifyIdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/profile/verify');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { ninVerified: true, fullName: true },
  });

  if (dbUser?.ninVerified) {
    redirect('/profile');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
            ← Profile
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center space-y-5">
          <div className="text-5xl">🪪</div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Verify your identity</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              SpaceLY requires NIN verification to build a trusted community. Verified users unlock
              higher trust scores, premium listings, and priority bookings.
            </p>
          </div>

          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-left space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">What you need</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                Your 11-digit NIN (National Identification Number)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                A clear photo of your NIN slip or ID card
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                2–3 minutes to complete the process
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
            NIN verification is currently being set up. You will receive an SMS when it is live.
          </div>

          <Link
            href="/profile"
            className="btn-ghost inline-block rounded-xl px-6 py-2.5 text-sm font-medium border border-neutral-200"
          >
            Back to profile
          </Link>
        </div>
      </main>
    </div>
  );
}
