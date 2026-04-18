import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ListingForm } from '@/components/listings/ListingForm';

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/listings/new');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, paystackSubaccountCode: true },
  });
  if (dbUser?.role !== 'OWNER') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary">SpaceLY</Link>
          <Link href="/dashboard/listings" className="text-sm text-muted-foreground hover:text-foreground">
            ← My listings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Create a new listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your space will be reviewed by our team before going live.
          </p>
        </div>

        {!dbUser?.paystackSubaccountCode && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">Payout account not set up</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You need a bank account connected to receive payments.{' '}
              <Link href="/dashboard/settings/payout" className="underline font-semibold">
                Set up payouts →
              </Link>
            </p>
          </div>
        )}

        <ListingForm />
      </main>
    </div>
  );
}
