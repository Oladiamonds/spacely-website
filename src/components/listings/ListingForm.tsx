'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SpaceType } from '@/types';
import { SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ListingFormValues {
  type: SpaceType;
  name: string;
  description: string;
  houseRules: string;
  address: string;
  neighborhood: string;
  latitude: string;
  longitude: string;
  pricePerHourKobo: number;
  securityDepositKobo: number;
  minBookingHours: number;
  maxCapacity: number;
  availability: WeekDay[];
}

interface WeekDay {
  dayOfWeek: number; // 0=Sun…6=Sat
  isAvailable: boolean;
  openTime: string;  // "09:00"
  closeTime: string; // "21:00"
}

interface ListingFormProps {
  initialValues?: Partial<ListingFormValues>;
  spaceId?: string; // If set, will PATCH instead of POST
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_AVAILABILITY: WeekDay[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  isAvailable: i !== 0, // All except Sunday open by default
  openTime: '09:00',
  closeTime: '21:00',
}));

const STEP_LABELS = ['Type', 'Details', 'Location', 'Pricing', 'Availability', 'Review'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`h-2 rounded-full transition-all ${
            i < current ? 'bg-primary w-6' :
            i === current ? 'bg-primary w-8' :
            'bg-neutral-200 w-4'
          }`} />
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        {STEP_LABELS[current]} · Step {current + 1} of {total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function ListingForm({ initialValues, spaceId }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  // Form state
  const [type, setType] = useState<SpaceType>(initialValues?.type ?? 'PHOTOGRAPHY');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [houseRules, setHouseRules] = useState(initialValues?.houseRules ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [neighborhood, setNeighborhood] = useState(initialValues?.neighborhood ?? '');
  const [latitude, setLatitude] = useState(initialValues?.latitude ?? '');
  const [longitude, setLongitude] = useState(initialValues?.longitude ?? '');
  const [priceNaira, setPriceNaira] = useState(
    initialValues?.pricePerHourKobo ? String(initialValues.pricePerHourKobo / 100) : ''
  );
  const [depositNaira, setDepositNaira] = useState(
    initialValues?.securityDepositKobo ? String(initialValues.securityDepositKobo / 100) : '10000'
  );
  const [minHours, setMinHours] = useState(initialValues?.minBookingHours ?? 1);
  const [capacity, setCapacity] = useState(initialValues?.maxCapacity ?? 1);
  const [availability, setAvailability] = useState<WeekDay[]>(
    initialValues?.availability ?? DEFAULT_AVAILABILITY
  );

  function updateDay(dayOfWeek: number, patch: Partial<WeekDay>) {
    setAvailability((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
    );
  }

  // ─── Step validation ───
  function canProceed(): boolean {
    switch (step) {
      case 0: return !!type;
      case 1: return name.trim().length >= 5 && description.trim().length >= 20;
      case 2: return address.trim().length > 0 && neighborhood.trim().length > 0;
      case 3: return parseFloat(priceNaira) >= 500 && parseFloat(depositNaira) >= 0;
      case 4: return availability.some((d) => d.isAvailable);
      default: return true;
    }
  }

  // ─── Submit ───
  async function handleSubmit() {
    setError('');
    const pricePerHourKobo = Math.round(parseFloat(priceNaira) * 100);
    const securityDepositKobo = Math.round(parseFloat(depositNaira) * 100);

    const payload = {
      type,
      name: name.trim(),
      description: description.trim(),
      houseRules: houseRules.trim() || undefined,
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      city: 'Lagos',
      latitude: parseFloat(latitude) || 6.5244,
      longitude: parseFloat(longitude) || 3.3792,
      pricePerHourKobo,
      securityDepositKobo,
      minBookingHours: minHours,
      maxCapacity: capacity,
      availability,
    };

    startTransition(async () => {
      const url = spaceId ? `/api/spaces/${spaceId}` : '/api/spaces';
      const method = spaceId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save listing');
        return;
      }

      const id = data.id ?? spaceId;
      router.push(`/dashboard/listings/${id}/photos`);
    });
  }

  const SPACE_TYPES: SpaceType[] = ['FASHION', 'PHOTOGRAPHY', 'MUSIC', 'KITCHEN', 'BEAUTY'];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <StepIndicator current={step} total={STEP_LABELS.length} />

      {/* ── Step 0: Type ── */}
      {step === 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">What type of space is this?</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose the category that best describes your space.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SPACE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all hover:border-primary ${
                  type === t ? 'border-primary bg-primary/5' : 'border-neutral-200'
                }`}
              >
                <span className="text-3xl">{SPACE_TYPE_EMOJI[t]}</span>
                <span className="text-sm font-semibold text-foreground">{SPACE_TYPE_LABELS[t]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Tell us about your space</h2>
          <p className="text-sm text-muted-foreground mb-5">A great description and clear house rules build trust with artisans.</p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Space name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adunola Photography Studio, Lekki"
              maxLength={80}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{name.length}/80</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1500}
              placeholder="Describe what makes your space special — equipment, ambience, natural light, accessibility…"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/1500</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">House rules <span className="text-muted-foreground text-xs">(optional)</span></label>
            <textarea
              value={houseRules}
              onChange={(e) => setHouseRules(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="No smoking · Please remove shoes · Equipment must be returned to original position…"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Where is your space?</h2>
          <p className="text-sm text-muted-foreground mb-5">Artisans will see the neighbourhood. Exact address is only shared after booking.</p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Street address <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="14 Adeola Odeku Street"
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Neighbourhood <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g. Victoria Island, Lekki Phase 1, Yaba"
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="6.5244"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="3.3792"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Find your coordinates at{' '}
            <span className="text-primary">maps.google.com</span>{' '}
            → right-click on your location → copy coordinates.
          </p>
        </div>
      )}

      {/* ── Step 3: Pricing ── */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Set your pricing</h2>
          <p className="text-sm text-muted-foreground mb-5">SpaceLY takes 15% commission. You keep 85% of each booking.</p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Price per hour (₦) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <input
                type="number"
                min="500"
                step="500"
                value={priceNaira}
                onChange={(e) => setPriceNaira(e.target.value)}
                placeholder="e.g. 15000"
                className="h-11 w-full rounded-xl border border-neutral-200 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {parseFloat(priceNaira) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                You earn <span className="font-semibold text-foreground">₦{(parseFloat(priceNaira) * 0.85).toLocaleString('en-NG')}</span> per hour after 15% commission.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Refundable deposit (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={depositNaira}
                onChange={(e) => setDepositNaira(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Returned to artisan within 48h of session if no damage. Default ₦10,000.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Min booking (hours)</label>
              <select
                value={minHours}
                onChange={(e) => setMinHours(parseInt(e.target.value))}
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {[1, 2, 3, 4].map((h) => <option key={h} value={h}>{h}h minimum</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Max capacity</label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Availability ── */}
      {step === 4 && (
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Set your weekly schedule</h2>
          <p className="text-sm text-muted-foreground mb-5">Artisans can only book during your open hours.</p>
          <div className="space-y-2">
            {availability.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => updateDay(day.dayOfWeek, { isAvailable: !day.isAvailable })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${day.isAvailable ? 'bg-primary' : 'bg-neutral-200'}`}
                  role="switch"
                  aria-checked={day.isAvailable}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${day.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="w-24 text-sm font-medium text-foreground">{DAY_NAMES[day.dayOfWeek]}</span>
                {day.isAvailable ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => updateDay(day.dayOfWeek, { openTime: e.target.value })}
                      className="h-9 rounded-lg border border-neutral-200 px-2 text-sm outline-none focus:border-primary"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => updateDay(day.dayOfWeek, { closeTime: e.target.value })}
                      className="h-9 rounded-lg border border-neutral-200 px-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <div className="space-y-5">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Review your listing</h2>
          <p className="text-sm text-muted-foreground">Your listing will be submitted for review. Our team typically approves within 24 hours.</p>
          <dl className="space-y-3 rounded-xl bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{SPACE_TYPE_EMOJI[type]} {SPACE_TYPE_LABELS[type]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-right max-w-[60%] truncate">{name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">{neighborhood}, Lagos</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Price/hr</dt>
              <dd className="font-medium">₦{parseFloat(priceNaira).toLocaleString('en-NG')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Min booking</dt>
              <dd className="font-medium">{minHours}h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Open days</dt>
              <dd className="font-medium">
                {availability.filter((d) => d.isAvailable).map((d) => DAY_NAMES[d.dayOfWeek].slice(0, 3)).join(', ')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="btn-ghost flex-1 rounded-xl h-12 border border-neutral-200 text-sm font-medium"
          >
            ← Back
          </button>
        )}
        {step < STEP_LABELS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="btn-primary flex-1 rounded-xl h-12 font-semibold disabled:opacity-40"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="btn-primary flex-1 rounded-xl h-12 font-semibold disabled:opacity-60"
          >
            {isPending ? 'Saving…' : spaceId ? 'Save changes' : 'Submit for review →'}
          </button>
        )}
      </div>
    </div>
  );
}
