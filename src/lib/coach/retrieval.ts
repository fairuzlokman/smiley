/**
 * The "R" in RAG: find the tips whose meaning is closest to the user's result.
 * Each tip was turned into a vector (embedding) once by `npm run tips:embed`;
 * here we only compare vectors, so this file never calls an API.
 */

/** Gemini's text embedding model (free tier available). */
export const EMBEDDING_MODEL = "gemini-embedding-001";
/** Shorter vectors than the default 3072: a smaller file and faster maths, plenty for 15 tips. */
export const EMBEDDING_DIMENSIONS = 256;

export type EmbeddedTip = { id: string; embedding: number[] };

/** 1 = same direction (same meaning), 0 = unrelated. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must have the same length");
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Brute force: score every tip and keep the best k. Fine for a handful of tips;
 * with thousands you would use a vector index (e.g. Turso/libSQL vector search) instead.
 */
export function findRelevantTips(queryEmbedding: number[], tips: EmbeddedTip[], k = 3): string[] {
  return tips
    .map((tip) => ({ id: tip.id, similarity: cosineSimilarity(queryEmbedding, tip.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k)
    .map((tip) => tip.id);
}
