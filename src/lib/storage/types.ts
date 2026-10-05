export type StoredImage = {
  /** Public URL that can be rendered in an <img>. */
  url: string;
  /** Storage key, kept so the file can be deleted later. */
  pathname: string;
};

export interface ImageStorage {
  upload(
    image: Buffer,
    options: { contentType: string; userId: string },
  ): Promise<StoredImage>;
}
