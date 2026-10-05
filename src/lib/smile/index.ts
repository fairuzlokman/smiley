import type { SmileAnalyzer } from "./types";

let instance: SmileAnalyzer | undefined;

/**
 * Single entry point for the rest of the app. The face-api module is required
 * lazily so importing this file (e.g. in tests) doesn't load TensorFlow.
 */
export async function getAnalyzer(): Promise<SmileAnalyzer> {
  if (!instance) {
    const { FaceApiAnalyzer } = await import("./faceApiAnalyzer");
    instance = new FaceApiAnalyzer();
  }
  return instance;
}

export { NoFaceError } from "./types";
export type { Expressions, SmileAnalyzer, SmileLabel, SmileResult } from "./types";
