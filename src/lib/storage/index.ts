import { getEnv } from "@/lib/env";
import { LocalDiskStorage } from "./localDisk";
import type { ImageStorage } from "./types";
import { VercelBlobStorage } from "./vercelBlob";

let instance: ImageStorage | undefined;

/**
 * Single entry point so route handlers (and tests, via vi.mock) don't care which backend is used.
 * Vercel Blob whenever a token is configured; otherwise local disk in development only.
 */
export function getStorage(): ImageStorage {
  if (!instance) instance = createStorage();
  return instance;
}

function createStorage(): ImageStorage {
  const env = getEnv();
  if (env.BLOB_READ_WRITE_TOKEN) return new VercelBlobStorage();
  if (env.NODE_ENV === "production") {
    throw new Error("BLOB_READ_WRITE_TOKEN is required in production.");
  }
  console.warn("BLOB_READ_WRITE_TOKEN not set: storing uploads in public/uploads (development only).");
  return new LocalDiskStorage();
}

export type { ImageStorage, StoredImage } from "./types";
