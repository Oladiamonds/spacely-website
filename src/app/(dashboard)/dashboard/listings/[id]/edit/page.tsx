import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ListingForm } from '@/components/listings/ListingForm';
import type { ListingFormValues } from '@/components/listings/ListingForm';

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/dashboard/listings/${id}/edit`);

  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      availabilitySlots: true,
    },
  });

  if (!space) notFound();
  if (space.ownerId !== user.id) redirect('/dashboard/listings');

  const initialValues: Partial<ListingFormValues> = {
    type: space.type,
    name: space.name,
    description: space.description,
    houseRules: space.houseRules ?? '',
    address: space.address,
    neighborhood: space.neighborhood,
    latitude: String(space.latitude),
    longitude: String(space.longitude),
    pricePerHourKobo: space.pricePerHourKobo,
    securityDepositKobo: space.securityDepositKobo,
    minBookingHours: space.minBookingHours,
    maxCapacity: space.maxCapacity,
    availability: space.availabilitySlots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      isAvailable: s.isAvailable,
      openTime: s.openTime,
      closeTime: s.closeTime,
    })),
  };

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
          <h1 className="font-display text-2xl font-bold text-foreground">Edit listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">{space.name}</p>
          {space.status === 'LIVE' && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              ⚠️ Saving will move your listing back to pending review
            </div>
          )}
        </div>

        <ListingForm initialValues={initialValues} spaceId={id} />
      </main>
    </div>
  );
}
