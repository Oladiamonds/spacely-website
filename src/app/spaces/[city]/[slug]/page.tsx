import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatNaira, SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';

interface PageProps {
  params: Promise<{ city: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const space = await prisma.space.findFirst({
    where: { slug, status: 'LIVE' },
    select: { name: true, description: true, type: true, neighborhood: true, city: true },
  });

  if (!space) return { title: 'Space not found — SpaceLY' };

  return {
    title: `${space.name} — ${SPACE_TYPE_LABELS[space.type]} in ${space.neighborhood} · SpaceLY`,
    description: space.description.slice(0, 160),
  };
}

// ─────────────────────────────────────────────────────────────
// Review rating display
// ─────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill={n <= Math.round(rating) ? '#F59E0B' : 'none'}
          stroke={n <= Math.round(rating) ? 'none' : '#D1D5DB'}
          strokeWidth="1.5"
          className={sz}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function SpaceDetailPage({ params }: PageProps) {
  const { city, slug } = await params;

  const space = await prisma.space.findFirst({
    where: { slug, status: 'LIVE' },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          trustScore: true,
          ninVerified: true,
          createdAt: true,
        },
      },
      photos: { orderBy: { order: 'asc' } },
      tools: { orderBy: { category: 'asc' } },
      availability: { orderBy: { dayOfWeek: 'asc' } },
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reviewer: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!space) notFound();

  const heroPhoto = space.photos.find((p) => p.isHero) ?? space.photos[0];
  const otherPhotos = space.photos.filter((p) => p.id !== heroPhoto?.id).slice(0, 4);

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group tools by category
  const toolsByCategory = space.tools.reduce<Record<string, typeof space.tools>>(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold text-primary">
            SpaceLY
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/spaces/${city}`} className="text-muted-foreground hover:text-foreground">
              ← Back to {city.charAt(0).toUpperCase() + city.slice(1)}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/spaces/${city}`} className="hover:text-foreground">
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </Link>
          <span aria-hidden="true">›</span>
          <span className="text-foreground line-clamp-1">{space.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Photos + Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo gallery */}
            <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl" style={{ height: 400 }}>
              {heroPhoto && (
                <div className="relative col-span-2 row-span-2">
                  <Image
                    src={heroPhoto.cloudinaryUrl}
                    alt={heroPhoto.altText ?? space.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              )}
              {otherPhotos.map((photo, i) => (
                <div key={photo.id} className="relative col-span-1 row-span-1">
                  <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.altText ?? `${space.name} photo ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              ))}
              {!heroPhoto && (
                <div className="col-span-4 row-span-2 flex items-center justify-center bg-neutral-100 text-6xl rounded-2xl">
                  {SPACE_TYPE_EMOJI[space.type]}
                </div>
              )}
            </div>

            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                    {space.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {SPACE_TYPE_EMOJI[space.type]} {SPACE_TYPE_LABELS[space.type]} ·{' '}
                    {space.neighborhood}, {space.city}
                  </p>
                </div>
                {space.isSpacelyVerified && (
                  <span className="trust-badge shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    SpaceLY Verified
                  </span>
                )}
              </div>

              {space.averageRating && space.totalReviews > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={space.averageRating} />
                  <span className="text-sm font-medium text-foreground">
                    {space.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({space.totalReviews} {space.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-lg font-semibold text-foreground">About this space</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {space.description}
              </p>
            </section>

            {/* Tools / Equipment */}
            {Object.keys(toolsByCategory).length > 0 && (
              <section aria-labelledby="tools-heading">
                <h2 id="tools-heading" className="text-lg font-semibold text-foreground">Equipment & tools</h2>
                <div className="mt-4 space-y-4">
                  {Object.entries(toolsByCategory).map(([category, tools]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {category}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {tools.map((tool) => (
                          <div
                            key={tool.id}
                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-foreground line-clamp-1">{tool.name}</p>
                            {(tool.brand || tool.model) && (
                              <p className="text-xs text-muted-foreground">
                                {[tool.brand, tool.model].filter(Boolean).join(' ')}
                              </p>
                            )}
                            {tool.quantity > 1 && (
                              <p className="text-xs text-muted-foreground">×{tool.quantity}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Availability */}
            {space.availability.length > 0 && (
              <section aria-labelledby="availability-heading">
                <h2 id="availability-heading" className="text-lg font-semibold text-foreground">
                  Availability
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {space.availability.map((slot) => (
                    <div
                      key={slot.dayOfWeek}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        slot.isAvailable
                          ? 'border-neutral-200 bg-white'
                          : 'border-neutral-100 bg-neutral-50 opacity-50'
                      }`}
                    >
                      <p className="font-medium text-foreground">{DAY_NAMES[slot.dayOfWeek]}</p>
                      {slot.isAvailable ? (
                        <p className="text-xs text-muted-foreground">
                          {slot.openTime} – {slot.closeTime}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Closed</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* House rules */}
            {space.houseRules && (
              <section aria-labelledby="rules-heading">
                <h2 id="rules-heading" className="text-lg font-semibold text-foreground">House rules</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {space.houseRules}
                </p>
              </section>
            )}

            {/* Reviews */}
            {space.reviews.length > 0 && (
              <section aria-labelledby="reviews-heading">
                <h2 id="reviews-heading" className="text-lg font-semibold text-foreground">
                  Reviews
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({space.totalReviews})
                  </span>
                </h2>
                <div className="mt-4 space-y-4">
                  {space.reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-neutral-100 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden">
                          {review.reviewer?.avatarUrl ? (
                            <Image
                              src={review.reviewer.avatarUrl}
                              alt={review.reviewer.fullName}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            review.reviewer?.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {review.reviewer?.fullName}
                          </p>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: Booking widget (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-foreground">
                  {formatNaira(space.pricePerHourKobo)}
                </span>
                <span className="text-sm text-muted-foreground">/ hour</span>
              </div>

              {space.securityDepositKobo > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  + {formatNaira(space.securityDepositKobo)} refundable deposit
                </p>
              )}

              {space.minBookingHours > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum {space.minBookingHours} hours
                </p>
              )}

              <Link
                href={`/book/${space.id}`}
                className="btn-primary mt-4 w-full text-center block rounded-xl py-3 font-semibold"
              >
                Book this space
              </Link>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                You won't be charged until you confirm
              </p>

              {/* Owner card */}
              <div className="mt-6 border-t border-neutral-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hosted by
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {space.owner.avatarUrl ? (
                      <Image
                        src={space.owner.avatarUrl}
                        alt={space.owner.fullName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-semibold text-primary">
                        {space.owner.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{space.owner.fullName}</p>
                    {space.owner.ninVerified && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-green-500">✓</span> ID Verified
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
