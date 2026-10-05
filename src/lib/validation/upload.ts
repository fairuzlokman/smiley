export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Vercel serverless functions reject bodies over 4.5 MB, so stay under that. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Shared by the API route and the client-side pre-check so both give the same answer.
 * Works on anything with `type` and `size` (a browser File or a server-side File).
 */
export function validateImageFile(file: {
  type: string;
  size: number;
}): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return { ok: false, message: "Use a JPG, PNG or WebP image." };
  }
  if (file.size === 0) {
    return { ok: false, message: "The selected file is empty." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image must be 4 MB or smaller." };
  }
  return { ok: true };
}
