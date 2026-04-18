/**
 * SpaceLY — Shared TypeScript Types
 * These mirror the Prisma schema. All monetary values are in KOBO.
 */

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────

export type SpaceType = 'FASHION' | 'PHOTOGRAPHY' | 'MUSIC' | 'KITCHEN' | 'BEAUTY';

export type SpaceStatus = 'DRAFT' | 'PENDING_REVIEW' | 'LIVE' | 'PAUSED' | 'SUSPENDED';

export type BookingStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REFUNDED';

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export type UserRole = 'ARTISAN' | 'OWNER' | 'ADMIN';

// ─────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  phoneVerified: boolean;
  ninVerified: boolean;
  bvnVerified: boolean;
  trustScore: number; // 0–100
  instagramHandle?: string | null;
  portfolioUrl?: string | null;
  subscriptionPlan?: string | null;
  subscriptionEnds?: Date | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────
// SPACE
// ─────────────────────────────────────────────────────────────

export interface SpacePhoto {
  id: string;
  spaceId: string;
  cloudinaryUrl: string;
  cloudinaryId: string;
  altText?: string | null;
  order: number;
  isHero: boolean;
}

export interface SpaceTool {
  id: string;
  spaceId: string;
  name: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface Space {
  id: string;
  ownerId: string;
  owner?: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'trustScore' | 'ninVerified'>;
  name: string;
  slug: string;
  type: SpaceType;
  status: SpaceStatus;
  description: string;
  houseRules?: string | null;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  pricePerHourKobo: number;
  securityDepositKobo: number;
  maxCapacity: number;
  minBookingHours: number;
  isSpacelyVerified: boolean;
  commissionRate: number;
  commissionFreeUntil?: Date | null;
  averageRating?: number | null;
  totalReviews: number;
  totalBookings: number;
  photos: SpacePhoto[];
  tools: SpaceTool[];
  createdAt: Date;
  // Computed
  distanceKm?: number;
}

/** Lightweight version used in search results and cards */
export interface SpaceCard {
  id: string;
  name: string;
  slug: string;
  type: SpaceType;
  neighborhood: string;
  city: string;
  pricePerHourKobo: number;
  averageRating?: number | null;
  totalReviews: number;
  isSpacelyVerified: boolean;
  heroPhoto?: string | null;
  distanceKm?: number;
}

// ─────────────────────────────────────────────────────────────
// BOOKING
// ─────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  artisanId: string;
  artisan?: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'phone' | 'trustScore'>;
  spaceId: string;
  space?: Pick<Space, 'id' | 'name' | 'address' | 'neighborhood' | 'type'> & {
    heroPhoto?: string | null;
  };
  startTime: Date;
  endTime: Date;
  totalHours: number;
  pricePerHourKobo: number;
  bookingAmountKobo: number;
  securityDepositKobo: number;
  totalAmountKobo: number;
  commissionAmountKobo: number;
  ownerPayoutKobo: number;
  status: BookingStatus;
  heldUntil?: Date | null;
  paystackReference?: string | null;
  paidAt?: Date | null;
  depositReturnedAt?: Date | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────
// AVAILABILITY
// ─────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  openTime: string;  // "09:00"
  closeTime: string; // "21:00"
  isAvailable: boolean;
}

export interface TimeSlot {
  time: string;      // "14:00"
  available: boolean;
  bookedUntil?: string | null;
}

// ─────────────────────────────────────────────────────────────
// REVIEW
// ─────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewer?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  spaceId: string;
  rating: number;
  spaceQualityRating?: number | null;
  equipmentRating?: number | null;
  accuracyRating?: number | null;
  valueRating?: number | null;
  comment?: string | null;
  ownerResponse?: string | null;
  ownerRespondedAt?: Date | null;
  isPublished: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────
// API SHAPES
// ─────────────────────────────────────────────────────────────

/** POST /api/bookings — create booking + hold slot */
export interface CreateBookingInput {
  spaceId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
}

/** POST /api/spaces — create listing */
export interface CreateSpaceInput {
  name: string;
  type: SpaceType;
  description: string;
  houseRules?: string;
  address: string;
  neighborhood: string;
  pricePerHourKobo: number;
  securityDepositKobo?: number;
  minBookingHours?: number;
  availability: AvailabilitySlot[];
}

/** GET /api/spaces — search query params */
export interface SpaceSearchParams {
  city?: string;
  neighborhood?: string;
  type?: SpaceType;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minPriceKobo?: number;
  maxPriceKobo?: number;
  tools?: string[];
  date?: string;      // ISO date for availability check
  hours?: number;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Convert kobo to naira string: 2000000 → "₦20,000" */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString('en-NG')}`;
}

/** Space type display names */
export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  FASHION: 'Fashion Studio',
  PHOTOGRAPHY: 'Photography Studio',
  MUSIC: 'Music Studio',
  KITCHEN: 'Commercial Kitchen',
  BEAUTY: 'Beauty Studio',
};

/** Space type emoji */
export const SPACE_TYPE_EMOJI: Record<SpaceType, string> = {
  FASHION: '✂️',
  PHOTOGRAPHY: '📷',
  MUSIC: '🎵',
  KITCHEN: '🍳',
  BEAUTY: '💄',
};
