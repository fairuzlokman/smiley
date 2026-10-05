import { put } from "@vercel/blob";
import type { ImageStorage, StoredImage } from "./types";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class VercelBlobStorage implements ImageStorage {
  async upload(
    image: Buffer,
    options: { contentType: string; userId: string },
  ): Promise<StoredImage> {
    const ext = EXTENSIONS[options.contentType] ?? "bin";
    const pathname = `uploads/${options.userId}/${crypto.randomUUID()}.${ext}`;
    const blob = await put(pathname, image, {
      access: "public",
      contentType: options.contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, pathname: blob.pathname };
  }
}
