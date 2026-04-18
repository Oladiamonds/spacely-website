'use client';

import { useState, useRef, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchPhotos(id: string) {
  const res = await fetch(`/api/spaces/${id}`);
  if (!res.ok) throw new Error('Failed to load');
  const data = await res.json();
  return (data.photos ?? []) as { id: string; cloudinaryUrl: string; isHero: boolean; altText?: string }[];
}

export default function PhotosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['space-photos', id],
    queryFn: () => fetchPhotos(id),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError('');
    setUploading(true);

    let failed = false;
    for (const [index, file] of files.entries()) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large. Max 10 MB per photo.`);
        failed = true;
        break;
      }
      const form = new FormData();
      form.append('file', file);
      form.append('isHero', photos.length === 0 && index === 0 ? 'true' : 'false');

      const res = await fetch(`/api/spaces/${id}/photos`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Upload failed');
        failed = true;
        break;
      }
    }

    setUploading(false);
    await queryClient.invalidateQueries({ queryKey: ['space-photos', id] });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(photoId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/spaces/${id}/photos?photoId=${photoId}`, { method: 'DELETE' });
      if (!res.ok) { setError('Failed to delete photo'); return; }
      await queryClient.invalidateQueries({ queryKey: ['space-photos', id] });
    });
  }

  async function handleSetHero(photoId: string) {
    startTransition(async () => {
      // Re-upload isn't needed — patch via PATCH /api/spaces/[id] isn't the right route.
      // Instead call a dedicated endpoint. For now, delete and re-upload isn't viable.
      // We use a simple PATCH to spaces/[id] with a heroPhotoId flag.
      const res = await fetch(`/api/spaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroPhotoId: photoId }),
      });
      if (!res.ok) { setError('Failed to set hero photo'); return; }
      await queryClient.invalidateQueries({ queryKey: ['space-photos', id] });
    });
  }

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
          <h1 className="font-display text-2xl font-bold text-foreground">Add photos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add at least 3 photos. The first photo marked as hero is shown in search results.
          </p>
        </div>

        {/* Upload zone */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <p className="text-3xl mb-2">{uploading ? '⏳' : '📷'}</p>
          <p className="text-sm font-medium text-foreground">
            {uploading ? 'Uploading…' : 'Click to upload photos'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Max 10 MB each</p>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {error && (
          <div role="alert" className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Photo grid */}
        {isLoading ? (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100">
                <Image
                  src={photo.cloudinaryUrl}
                  alt={photo.altText ?? 'Space photo'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 200px"
                />
                {photo.isHero && (
                  <div className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    Cover
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!photo.isHero && (
                    <button
                      type="button"
                      onClick={() => handleSetHero(photo.id)}
                      disabled={isPending}
                      className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-foreground hover:bg-white"
                    >
                      Set cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={isPending}
                    className="rounded-lg bg-red-500/90 px-2 py-1 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">No photos yet. Upload at least 3 to submit for review.</p>
        )}

        {/* Done CTA */}
        {photos.length >= 1 && (
          <div className="mt-8 flex gap-3">
            <Link
              href={`/dashboard/listings/${id}/edit`}
              className="btn-ghost flex-1 rounded-xl h-12 border border-neutral-200 flex items-center justify-center text-sm font-medium"
            >
              ← Edit details
            </Link>
            <Link
              href="/dashboard/listings"
              className="btn-primary flex-1 rounded-xl h-12 flex items-center justify-center font-semibold text-sm"
            >
              Done — view listings →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
