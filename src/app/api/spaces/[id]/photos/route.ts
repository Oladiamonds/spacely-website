import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { uploadSpacePhoto, deletePhoto } from '@/lib/cloudinary';

// POST /api/spaces/[id]/photos — upload a photo for a space
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { ownerId: true },
  });
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });
  if (space.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Expect multipart/form-data with a "file" field
  const formData = await request.formData();
  const file = formData.get('file');
  const altText = formData.get('altText') as string | null;
  const isHeroStr = formData.get('isHero') as string | null;
  const isHero = isHeroStr === 'true';

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 });
  }

  // Convert File to Buffer for Cloudinary
  const arrayBuffer = await (file as File).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataUrl = `data:${(file as File).type};base64,${buffer.toString('base64')}`;

  const upload = await uploadSpacePhoto(dataUrl, {
    spaceId,
    altText: altText ?? undefined,
  });

  // If marking as hero, demote previous hero
  if (isHero) {
    await prisma.spacePhoto.updateMany({
      where: { spaceId, isHero: true },
      data: { isHero: false },
    });
  }

  const photo = await prisma.spacePhoto.create({
    data: {
      spaceId,
      cloudinaryUrl: upload.url,
      cloudinaryId: upload.publicId,
      altText: altText ?? null,
      isHero,
      isApproved: false, // Pending moderation
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

// DELETE /api/spaces/[id]/photos?photoId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const photoId = new URL(request.url).searchParams.get('photoId');
  if (!photoId) return NextResponse.json({ error: 'photoId is required' }, { status: 400 });

  const photo = await prisma.spacePhoto.findUnique({
    where: { id: photoId },
    include: { space: { select: { ownerId: true } } },
  });
  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  if (photo.space.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await Promise.all([
    deletePhoto(photo.cloudinaryId),
    prisma.spacePhoto.delete({ where: { id: photoId } }),
  ]);

  return NextResponse.json({ deleted: true });
}
