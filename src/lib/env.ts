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
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
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
