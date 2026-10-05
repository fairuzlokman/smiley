import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, validateImageFile } from "@/lib/validation/upload";

describe("validateImageFile", () => {
  it("accepts jpeg, png and webp within the size limit", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateImageFile({ type, size: 1024 })).toEqual({ ok: true });
    }
  });

  it("rejects other content types", () => {
    const result = validateImageFile({ type: "image/gif", size: 1024 });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ message: expect.stringContaining("JPG, PNG or WebP") });
  });

  it("rejects empty files", () => {
    expect(validateImageFile({ type: "image/png", size: 0 }).ok).toBe(false);
  });

  it("rejects files over the limit but accepts the limit itself", () => {
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES }).ok).toBe(true);
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }).ok).toBe(false);
  });
});
