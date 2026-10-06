import { describe, expect, it } from "vitest";
import {
  happinessToScore,
  labelForScore,
  pickPrimaryFace,
  scoreFaces,
  type DetectedFace,
} from "@/lib/smile/score";
import { NoFaceError, type Expressions } from "@/lib/smile/types";

const expressions = (happy: number): Expressions => ({
  neutral: 1 - happy,
  happy,
  sad: 0,
  angry: 0,
  fearful: 0,
  disgusted: 0,
  surprised: 0,
});

const face = (happy: number, size = 100): DetectedFace => ({
  box: { width: size, height: size },
  expressions: expressions(happy),
});

describe("happinessToScore", () => {
  it("maps a probability to a 0-100 integer", () => {
    expect(happinessToScore(0)).toBe(0);
    expect(happinessToScore(0.5)).toBe(50);
    expect(happinessToScore(0.987)).toBe(99);
    expect(happinessToScore(1)).toBe(100);
  });

  it("clamps out-of-range and non-finite values", () => {
    expect(happinessToScore(1.3)).toBe(100);
    expect(happinessToScore(-0.2)).toBe(0);
    expect(happinessToScore(Number.NaN)).toBe(0);
  });
});

describe("labelForScore", () => {
  it.each([
    [0, "Not smiling"],
    [20, "Not smiling"],
    [21, "Hint of a smile"],
    [50, "Hint of a smile"],
    [51, "Smiling"],
    [80, "Smiling"],
    [81, "Big smile"],
    [100, "Big smile"],
  ])("score %i → %s", (score, label) => {
    expect(labelForScore(score)).toBe(label);
  });
});

describe("pickPrimaryFace", () => {
  it("throws NoFaceError when there are no faces", () => {
    expect(() => pickPrimaryFace([])).toThrow(NoFaceError);
  });

  it("returns the face with the largest bounding box", () => {
    const small = face(0.9, 50);
    const big = face(0.1, 200);
    expect(pickPrimaryFace([small, big])).toBe(big);
    expect(pickPrimaryFace([big, small])).toBe(big);
  });
});

describe("scoreFaces", () => {
  it("scores the primary face and reports the face count", () => {
    const result = scoreFaces([face(0.2, 50), face(0.85, 300)]);
    expect(result.score).toBe(85);
    expect(result.label).toBe("Big smile");
    expect(result.faceCount).toBe(2);
  });

  it("rounds expressions to 3 decimals", () => {
    const result = scoreFaces([face(0.123456)]);
    expect(result.expressions.happy).toBe(0.123);
    expect(result.expressions.neutral).toBe(0.877);
  });

  it("propagates NoFaceError for an empty detection list", () => {
    expect(() => scoreFaces([])).toThrow(NoFaceError);
  });
});
