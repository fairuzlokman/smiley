import { config } from "dotenv";

/**
 * For CLI scripts and drizzle-kit, which run outside Next.js: load the same files
 * Next does (`.env.local` wins over `.env`). Next itself never uses this.
 */
export function loadEnvFiles() {
  config({ path: [".env.local", ".env"], quiet: true });
}
