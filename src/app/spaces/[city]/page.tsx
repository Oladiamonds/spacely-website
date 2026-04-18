import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { SpaceCard, SpaceCardSkeleton } from '@/components/spaces/SpaceCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';
import type { SpaceType } from '@/types';

interface PageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<{
    neighborhood?: string;
    type?: string;
    date?: string;
    hours?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    title: `Creative Studios in ${cityName} — SpaceLY`,
    description: `Book fashion studios, photography sets, music rooms, commercial kitchens and beauty salons in ${cityName} by the hour.`,
  };
}

// ─────────────────────────────────────────────────────────────
// Space results (server component — refetches on search param change)
// ─────────────────────────────────────────────────────────────

async function SpaceResults({
  city,
  neighborhood,
  type,
  minPriceKobo,
  maxPriceKobo,
  page,
  limit,
}: {
  city: string;
  neighborhood?: string;
  type?: SpaceType;
  minPriceKobo?: number;
  maxPriceKobo?: number;
  page: number;
  limit: number;
}) {
  const skip = (page - 1) * limit;

  const where = {
    status: 'LIVE' as const,
    city: { contains: city, mode: 'insensitive' as const },
    ...(neighborhood && {
      neighborhood: { contains: neighborhood, mode: 'insensitive' as const },
    }),
    ...(type && { type }),
    ...(minPriceKobo && { pricePerHourKobo: { gte: minPriceKobo } }),
    ...(maxPriceKobo && {
      pricePerHourKobo: {
        ...(minPriceKobo ? { gte: minPriceKobo } : {}),
        lte: maxPriceKobo,
      },
    }),
  };

  const [spaces, total] = await Promise.all([
    prisma.space.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isSpacelyVerified: 'desc' }, { averageRating: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        neighborhood: true,
        city: true,
        pricePerHourKobo: true,
        averageRating: true,
        totalReviews: true,
        isSpacelyVerified: true,
        photos: {
          where: { isHero: true },
          select: { cloudinaryUrl: true },
          take: 1,
        },
      },
    }),
    prisma.space.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  if (spaces.length === 0) {
    return (
      <div className="col-span-full py-16 text-center">
        <p className="text-3xl" aria-hidden="true">🔍</p>
        <h3 className="mt-4 text-lg font-semibold text-foreground">No spaces found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your filters or searching a different area.
        </p>
        <Link
          href={`/spaces/${city.toLowerCase()}`}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Clear all filters
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="col-span-full mb-2 text-sm text-muted-foreground">
        {total} {total === 1 ? 'space' : 'spaces'} found
      </div>

      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={{
            ...space,
            heroPhoto: space.photos[0]?.cloudinaryUrl ?? null,
          }}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="col-span-full mt-4 flex justify-center gap-2">
          {page > 1 && (
            <PaginationLink city={city} page={page - 1} label="← Previous" />
          )}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + 1;
            return (
              <PaginationLink key={p} city={city} page={p} label={String(p)} current={p === page} />
            );
          })}
          {page < totalPages && (
            <PaginationLink city={city} page={page + 1} label="Next →" />
          )}
        </div>
      )}
    </>
  );
}

function PaginationLink({
  city,
  page,
  label,
  current,
}: {
  city: string;
  page: number;
  label: string;
  current?: boolean;
}) {
  return (
    <Link
      href={`/spaces/${city}?page=${page}`}
      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
        current
          ? 'bg-primary text-white'
          : 'border border-neutral-200 bg-white text-foreground hover:bg-neutral-50'
      }`}
      aria-current={current ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter sidebar
// ─────────────────────────────────────────────────────────────

const SPACE_TYPES = Object.keys(SPACE_TYPE_LABELS) as SpaceType[];

function TypeFilterLinks({ city, activeType }: { city: string; activeType?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/spaces/${city}`}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          !activeType
            ? 'border-primary bg-primary text-white'
            : 'border-neutral-200 bg-white text-muted-foreground hover:border-primary/40'
        }`}
      >
        All types
      </Link>
      {SPACE_TYPES.map((type) => (
        <Link
          key={type}
          href={`/spaces/${city}?type=${type}`}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            activeType === type
              ? 'border-primary bg-primary text-white'
              : 'border-neutral-200 bg-white text-muted-foreground hover:border-primary/40'
          }`}
        >
          {SPACE_TYPE_EMOJI[type]} {SPACE_TYPE_LABELS[type]}
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function SpacesPage({ params, searchParams }: PageProps) {
  const { city } = await params;
  const sp = await searchParams;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  const neighborhood = sp.neighborhood;
  const type = sp.type as SpaceType | undefined;
  const minPriceKobo = sp.minPrice ? parseInt(sp.minPrice) * 100 : undefined;
  const maxPriceKobo = sp.maxPrice ? parseInt(sp.maxPrice) * 100 : undefined;
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const limit = 12;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold text-primary">
            SpaceLY
          </Link>
          <div className="hidden sm:block flex-1 max-w-xl mx-8">
            <SearchBar
              variant="inline"
              defaultValues={{ neighborhood, type, date: sp.date }}
            />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm px-4 py-2 rounded-xl">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span aria-hidden="true">›</span>
          <span className="text-foreground">{cityName}</span>
          {type && (
            <>
              <span aria-hidden="true">›</span>
              <span className="text-foreground">{SPACE_TYPE_LABELS[type]}</span>
            </>
          )}
        </nav>

        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {type ? SPACE_TYPE_LABELS[type] : 'Creative spaces'} in {cityName}
          {neighborhood && <span className="text-muted-foreground font-normal text-xl"> · {neighborhood}</span>}
        </h1>

        {/* Type filter pills */}
        <div className="mt-4 mb-6">
          <TypeFilterLinks city={city} activeType={type} />
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Suspense
            key={`${city}-${neighborhood}-${type}-${page}`}
            fallback={Array.from({ length: limit }).map((_, i) => (
              <SpaceCardSkeleton key={i} />
            ))}
          >
            <SpaceResults
              city={city}
              neighborhood={neighborhood}
              type={type}
              minPriceKobo={minPriceKobo}
              maxPriceKobo={maxPriceKobo}
              page={page}
              limit={limit}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
