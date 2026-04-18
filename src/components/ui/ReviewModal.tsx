'use client';

import { useState, useTransition } from 'react';

interface ReviewModalProps {
  bookingId: string;
  spaceName: string;
  onSuccess: () => void;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-xl transition-colors"
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <span className={display >= star ? 'text-amber-400' : 'text-neutral-200'}>★</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewModal({ bookingId, spaceName, onSuccess, onClose }: ReviewModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [spaceQuality, setSpaceQuality] = useState(0);
  const [equipment, setEquipment] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please give an overall rating');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          spaceQualityRating: spaceQuality || undefined,
          equipmentRating: equipment || undefined,
          accuracyRating: accuracy || undefined,
          valueRating: value || undefined,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit review');
        return;
      }
      onSuccess();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 id="review-modal-title" className="font-display text-lg font-bold text-foreground">
              Leave a review
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{spaceName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Overall rating */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Overall experience</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-3xl transition-transform hover:scale-110"
                  aria-label={`${star} star${star !== 1 ? 's' : ''} — ${RATING_LABELS[star]}`}
                >
                  <span className={rating >= star ? 'text-amber-400' : 'text-neutral-200'}>★</span>
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-1 text-sm font-medium text-foreground">{RATING_LABELS[rating]}</span>
              )}
            </div>
          </div>

          {/* Sub-ratings */}
          <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Detailed ratings (optional)</p>
            <StarRow label="Space quality" value={spaceQuality} onChange={setSpaceQuality} />
            <StarRow label="Equipment" value={equipment} onChange={setEquipment} />
            <StarRow label="Accuracy of listing" value={accuracy} onChange={setAccuracy} />
            <StarRow label="Value for money" value={value} onChange={setValue} />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-foreground mb-1.5">
              Your review <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell other artisans what you thought of this space…"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/500</p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 rounded-xl h-11 border border-neutral-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || rating === 0}
              className="btn-primary flex-1 rounded-xl h-11 font-semibold text-sm disabled:opacity-50"
            >
              {isPending ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
