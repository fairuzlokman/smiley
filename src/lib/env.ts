import { z } from "zod";

/**
 * Single place where process.env is read and validated.
 * Fails fast with a readable error instead of an undefined somewhere deep in a request.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  TURSO_DATABASE_URL: z.string().min(1).default("file:local.db"),
  TURSO_AUTH_TOKEN: z.string().optional(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  // Injected by Vercel when a Blob store is connected. The SDK authenticates with the platform OIDC token.
  BLOB_STORE_ID: z.string().optional(),
  // Optional: without it uploads still work, just without coach feedback.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: forget the cached env so a test can change process.env. */
export function resetEnvCache() {
  cached = undefined;
}
