import { describe, expect, it } from "vitest";
import { cosineSimilarity, findRelevantTips } from "@/lib/coach/retrieval";

describe("cosineSimilarity", () => {
  it("is 1 for vectors pointing the same way, whatever their length", () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it("is 0 for unrelated (perpendicular) vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("is 0 instead of NaN for an all-zero vector", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("rejects vectors of different lengths", () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
  });
});

describe("findRelevantTips", () => {
  // Tiny fake 2-D "embeddings": no API call needed to test the ranking.
  const tips = [
    { id: "lighting", embedding: [0, 1] },
    { id: "smile-more", embedding: [1, 0] },
    { id: "relax", embedding: [0.9, 0.1] },
    { id: "angle", embedding: [0.5, 0.5] },
  ];

  it("returns the closest tips first", () => {
    expect(findRelevantTips([1, 0], tips, 3)).toEqual(["smile-more", "relax", "angle"]);
  });

  it("returns at most k tips", () => {
    expect(findRelevantTips([0, 1], tips, 1)).toEqual(["lighting"]);
  });
});
