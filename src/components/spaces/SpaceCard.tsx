import Image from 'next/image';
import Link from 'next/link';
import { formatNaira, SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';
import type { SpaceCard as SpaceCardType } from '@/types';

interface SpaceCardProps {
  space: SpaceCardType;
  className?: string;
}

export function SpaceCard({ space, className = '' }: SpaceCardProps) {
  const label = SPACE_TYPE_LABELS[space.type];
  const emoji = SPACE_TYPE_EMOJI[space.type];

  return (
    <Link
      href={`/spaces/${space.city.toLowerCase()}/${space.slug}`}
      className={`space-card group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl ${className}`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100">
        {space.heroPhoto ? (
          <Image
            src={space.heroPhoto}
            alt={space.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            {emoji}
          </div>
        )}

        {/* Verified badge */}
        {space.isSpacelyVerified && (
          <span className="trust-badge absolute top-3 left-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </span>
        )}

        {/* Distance badge */}
        {space.distanceKm !== undefined && (
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {space.distanceKm < 1
              ? `${Math.round(space.distanceKm * 1000)}m`
              : `${space.distanceKm}km`}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
            {space.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-foreground">
            {formatNaira(space.pricePerHourKobo)}
            <span className="text-xs font-normal text-muted-foreground">/hr</span>
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {emoji} {label} · {space.neighborhood}
        </p>

        {/* Rating */}
        {space.averageRating && space.totalReviews > 0 ? (
          <div className="flex items-center gap-1 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 text-amber-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-foreground">
              {space.averageRating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({space.totalReviews})
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">New listing</p>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

export function SpaceCardSkeleton() {
  return (
    <div className="block" aria-hidden="true">
      <div className="skeleton aspect-[4/3] rounded-2xl" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="flex justify-between gap-2">
          <div className="skeleton skeleton-text h-4 w-3/4" />
          <div className="skeleton skeleton-text h-4 w-16" />
        </div>
        <div className="skeleton skeleton-text h-3 w-1/2" />
        <div className="skeleton skeleton-text h-3 w-1/4" />
      </div>
    </div>
  );
}
