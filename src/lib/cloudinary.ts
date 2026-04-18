import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// ─────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a space photo from a server-side Buffer or base64 string.
 * Applies auto quality + format (WebP where supported), max 2048px wide.
 */
export async function uploadSpacePhoto(
  source: Buffer | string,
  options: {
    spaceId: string;
    altText?: string;
  },
): Promise<UploadResult> {
  const uploadSource =
    source instanceof Buffer
      ? `data:image/jpeg;base64,${source.toString('base64')}`
      : source;

  const result = await cloudinary.uploader.upload(uploadSource, {
    folder: `spacely/spaces/${options.spaceId}`,
    transformation: [
      { width: 2048, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    context: options.altText ? { alt: options.altText } : undefined,
    resource_type: 'image',
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Upload a user avatar.
 * Crops to 400×400 face-aware, WebP output.
 */
export async function uploadAvatar(
  source: Buffer | string,
  userId: string,
): Promise<UploadResult> {
  const uploadSource =
    source instanceof Buffer
      ? `data:image/jpeg;base64,${source.toString('base64')}`
      : source;

  const result = await cloudinary.uploader.upload(uploadSource, {
    folder: `spacely/avatars`,
    public_id: `user_${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    resource_type: 'image',
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

export async function deletePhoto(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// ─────────────────────────────────────────────────────────────
// SIGNED UPLOAD (client-side direct upload)
// ─────────────────────────────────────────────────────────────

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

/**
 * Generate a short-lived signed upload credential for client-side uploads.
 * The client POSTs directly to Cloudinary — the file never touches our server.
 */
export function generateSignedUploadParams(folder: string): SignedUploadParams {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

// ─────────────────────────────────────────────────────────────
// TRANSFORMATION HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Build an optimized URL for a given public_id at specific dimensions.
 * Used to avoid shipping large originals to card thumbnails.
 */
export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {},
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop ?? 'fill',
        gravity: 'auto',
      },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}
