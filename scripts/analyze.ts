/**
 * Manual smoke test for the analyzer, outside of Next.js:
 *   npm run analyze <path-to-your-image>
 */
import fs from "node:fs/promises";
import { FaceApiAnalyzer } from "@/lib/smile/faceApiAnalyzer";
import { NoFaceError } from "@/lib/smile/types";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run analyze <path-to-your-image>");
    process.exit(1);
  }
  let image: Buffer;
  try {
    image = await fs.readFile(file);
  } catch {
    console.error(`File not found: ${file}\nUsage: npm run analyze <path-to-your-image>`);
    process.exit(1);
  }
  const analyzer = new FaceApiAnalyzer();
  const started = Date.now();
  try {
    const result = await analyzer.analyze(image);
    console.log(`backend: ${analyzer.backendName()}  time: ${Date.now() - started}ms`);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    if (err instanceof NoFaceError) {
      console.log(`backend: ${analyzer.backendName()}  time: ${Date.now() - started}ms`);
      console.log("No face detected.");
      process.exit(2);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
