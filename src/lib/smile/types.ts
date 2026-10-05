/** The seven expression classes face-api predicts (probabilities, roughly summing to 1). */
export type Expressions = {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
};

export type SmileLabel =
  | "Not smiling"
  | "Hint of a smile"
  | "Smiling"
  | "Big smile";

export type SmileResult = {
  /** 0–100 */
  score: number;
  label: SmileLabel;
  expressions: Expressions;
  faceCount: number;
};

/**
 * Anything that can turn image bytes into a SmileResult.
 * The real implementation uses face-api; tests swap in a fake.
 */
export interface SmileAnalyzer {
  analyze(image: Buffer): Promise<SmileResult>;
}

export class NoFaceError extends Error {
  constructor() {
    super("No face detected in the image. Try a clearer, front-facing photo.");
    this.name = "NoFaceError";
  }
}
