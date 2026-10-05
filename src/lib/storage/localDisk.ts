import fs from "node:fs/promises";
import path from "node:path";
import type { ImageStorage, StoredImage } from "./types";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Development-only fallback: writes into /public so `next dev` serves the file.
 * Lets the whole flow run locally without a Vercel Blob token. Not used in production
 * (the filesystem on Vercel is read-only and /public is frozen at build time).
 */
export class LocalDiskStorage implements ImageStorage {
  constructor(private readonly root = path.join(process.cwd(), "public", "uploads")) {}

  async upload(
    image: Buffer,
    options: { contentType: string; userId: string },
  ): Promise<StoredImage> {
    const ext = EXTENSIONS[options.contentType] ?? "bin";
    const relative = path.posix.join(options.userId, `${crypto.randomUUID()}.${ext}`);
    const absolute = path.join(this.root, relative);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, image);
    return { url: `/uploads/${relative}`, pathname: `local:${relative}` };
  }
}
