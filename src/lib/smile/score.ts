import { NoFaceError, type Expressions, type SmileLabel, type SmileResult } from "./types";

/** Minimal shape of a face-api detection that the scoring needs. */
export type DetectedFace = {
  box: { width: number; height: number };
  expressions: Expressions;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** "happy" probability → integer 0–100. */
export function happinessToScore(happy: number): number {
  if (!Number.isFinite(happy)) return 0;
  return clamp(Math.round(happy * 100), 0, 100);
}

export function labelForScore(score: number): SmileLabel {
  if (score <= 20) return "Not smiling";
  if (score <= 50) return "Hint of a smile";
  if (score <= 80) return "Smiling";
  return "Big smile";
}

/** With several faces, score the most prominent one (largest bounding box). */
export function pickPrimaryFace<T extends DetectedFace>(faces: T[]): T {
  if (faces.length === 0) throw new NoFaceError();
  return faces.reduce((best, face) =>
    face.box.width * face.box.height > best.box.width * best.box.height ? face : best,
  );
}

export function scoreFaces(faces: DetectedFace[]): SmileResult {
  const primary = pickPrimaryFace(faces);
  const score = happinessToScore(primary.expressions.happy);
  return {
    score,
    label: labelForScore(score),
    expressions: roundExpressions(primary.expressions),
    faceCount: faces.length,
  };
}

function roundExpressions(e: Expressions): Expressions {
  const out = {} as Expressions;
  for (const key of Object.keys(e) as (keyof Expressions)[]) {
    out[key] = Math.round(e[key] * 1000) / 1000;
  }
  return out;
}
