'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { SpaceType } from '@/types';
import { SPACE_TYPE_LABELS, SPACE_TYPE_EMOJI } from '@/types';

interface SearchBarProps {
  variant?: 'hero' | 'inline';
  defaultValues?: {
    neighborhood?: string;
    type?: SpaceType;
    date?: string;
    hours?: number;
  };
}

const SPACE_TYPES = Object.keys(SPACE_TYPE_LABELS) as SpaceType[];

export function SearchBar({ variant = 'hero', defaultValues }: SearchBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [neighborhood, setNeighborhood] = useState(defaultValues?.neighborhood ?? '');
  const [type, setType] = useState<SpaceType | ''>(defaultValues?.type ?? '');
  const [date, setDate] = useState(defaultValues?.date ?? '');
  const [hours, setHours] = useState(defaultValues?.hours?.toString() ?? '2');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();

    params.set('city', 'lagos');
    if (neighborhood) params.set('neighborhood', neighborhood);
    if (type) params.set('type', type);
    if (date) params.set('date', date);
    if (hours) params.set('hours', hours);

    startTransition(() => {
      router.push(`/spaces/lagos?${params.toString()}`);
    });
  }

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSearch}
      className={`${
        isHero
          ? 'rounded-2xl bg-white shadow-xl p-2 flex flex-col sm:flex-row gap-2'
          : 'rounded-xl border border-neutral-200 bg-white p-2 flex flex-col sm:flex-row gap-2'
      }`}
      role="search"
      aria-label="Search for creative spaces"
    >
      {/* Neighborhood / Location */}
      <div className="flex-1 min-w-0">
        <label htmlFor="search-neighborhood" className="sr-only">
          Neighborhood or area
        </label>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.274 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="search-neighborhood"
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Lekki, Yaba, VI…"
            className="h-11 w-full rounded-xl pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-neutral-200 self-stretch" aria-hidden="true" />

      {/* Space type */}
      <div className="sm:w-44">
        <label htmlFor="search-type" className="sr-only">
          Space type
        </label>
        <select
          id="search-type"
          value={type}
          onChange={(e) => setType(e.target.value as SpaceType | '')}
          className="h-11 w-full rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-neutral-700 bg-transparent"
        >
          <option value="">All types</option>
          {SPACE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SPACE_TYPE_EMOJI[t]} {SPACE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-neutral-200 self-stretch" aria-hidden="true" />

      {/* Date */}
      <div className="sm:w-40">
        <label htmlFor="search-date" className="sr-only">
          Date
        </label>
        <input
          id="search-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="h-11 w-full rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-neutral-700 bg-transparent"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary h-11 px-6 rounded-xl shrink-0 disabled:opacity-60"
        aria-label="Search spaces"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            Search
          </span>
        )}
      </button>
    </form>
  );
}
