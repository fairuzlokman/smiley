/**
 * Turns every tip in src/lib/coach/tips.ts into an embedding and saves them to
 * src/lib/coach/tips-embeddings.json. Run it once, and again whenever the tips change:
 *   npm run tips:embed
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/coach/retrieval";
import { TIPS } from "@/lib/coach/tips";
import { loadEnvFiles } from "@/lib/loadEnv";

const OUTPUT = path.join(process.cwd(), "src/lib/coach/tips-embeddings.json");

async function main() {
  loadEnvFiles();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Set GEMINI_API_KEY in .env.local first (free key: https://aistudio.google.com/apikey).");

  // One request for all tips: the API returns the vectors in the same order as the input.
  const response = await new GoogleGenAI({ apiKey }).models.embedContent({
    model: EMBEDDING_MODEL,
    contents: TIPS.map((tip) => tip.text),
    // RETRIEVAL_DOCUMENT tells the model these are the texts that will be searched.
    config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  const embeddings = response.embeddings ?? [];
  if (embeddings.length !== TIPS.length) throw new Error(`Expected ${TIPS.length} embeddings, got ${embeddings.length}`);

  const tips = TIPS.map((tip, i) => ({ id: tip.id, embedding: embeddings[i].values ?? [] }));
  await writeFile(OUTPUT, JSON.stringify({ model: EMBEDDING_MODEL, tips }) + "\n");
  console.log(`Embedded ${tips.length} tips → ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
