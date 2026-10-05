import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

// Cached on globalThis so `next dev` hot reloads don't open a new connection each time.
const globalForDb = globalThis as unknown as {
  __smileDb?: { client: Client; db: Db };
};

export function getDb(): Db {
  if (!globalForDb.__smileDb) {
    const env = getEnv();
    const client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN || undefined,
    });
    globalForDb.__smileDb = { client, db: drizzle(client, { schema }) };
  }
  return globalForDb.__smileDb.db;
}

/** Test helper: close and forget the cached connection. */
export function resetDb() {
  globalForDb.__smileDb?.client.close();
  globalForDb.__smileDb = undefined;
}
