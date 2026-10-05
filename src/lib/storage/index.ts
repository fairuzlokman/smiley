import { getEnv } from "@/lib/env";
import { LocalDiskStorage } from "./localDisk";
import type { ImageStorage } from "./types";
import { VercelBlobStorage } from "./vercelBlob";

let instance: ImageStorage | undefined;

/**
 * Single entry point so route handlers (and tests, via vi.mock) don't care which backend is used.
 * Vercel Blob whenever it is configured; otherwise local disk in development only.
 */
export function getStorage(): ImageStorage {
  if (!instance) instance = createStorage();
  return instance;
}

function createStorage(): ImageStorage {
  const env = getEnv();
  if (env.BLOB_STORE_ID) return new VercelBlobStorage();
  if (env.NODE_ENV === "production") {
    throw new Error("BLOB_STORE_ID is required in production (connect a Blob store to the Vercel project).");
  }
  console.warn("BLOB_STORE_ID not set: storing uploads in public/uploads (development only).");
  return new LocalDiskStorage();
}

export type { ImageStorage, StoredImage } from "./types";
