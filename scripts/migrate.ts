/**
 * Applies the SQL migrations in /drizzle to TURSO_DATABASE_URL.
 *   npm run db:migrate
 */
import { loadEnvFiles } from "@/lib/loadEnv";

async function main() {
  loadEnvFiles();
  // Imported after env files are loaded, because the db module reads env on first use.
  const { getDb, resetDb } = await import("@/db");
  const { runMigrations } = await import("@/db/migrate");

  const db = getDb();
  await runMigrations(db);
  console.log(`Migrations applied to ${process.env.TURSO_DATABASE_URL ?? "file:local.db"}`);
  resetDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
