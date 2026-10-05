import { defineConfig } from "drizzle-kit";
import { loadEnvFiles } from "./src/lib/loadEnv";

loadEnvFiles();

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const isRemote = url.startsWith("libsql://");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  ...(isRemote
    ? {
        dialect: "turso",
        dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN },
      }
    : { dialect: "sqlite", dbCredentials: { url } }),
});
