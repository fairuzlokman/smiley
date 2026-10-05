import { afterAll, beforeAll, beforeEach } from "vitest";
import { getDb, resetDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { uploads, users } from "@/db/schema";

/**
 * Gives each test file a fresh in-memory SQLite database with the real
 * migrations applied, and empties the tables before every test.
 */
export function setupTestDatabase() {
  beforeAll(async () => {
    resetDb();
    await runMigrations(getDb());
  });

  beforeEach(async () => {
    const db = getDb();
    await db.delete(uploads);
    await db.delete(users);
  });

  afterAll(() => {
    resetDb();
  });
}
