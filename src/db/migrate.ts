import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { Db } from "./index";

/** Applies the SQL files in /drizzle. Used by tests and by scripts/migrate.ts. */
export async function runMigrations(db: Db) {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
}
