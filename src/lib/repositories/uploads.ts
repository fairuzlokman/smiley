import { desc, eq, sql } from "drizzle-orm";
import { getDb, type Db } from "@/db";
import { uploads, type Upload } from "@/db/schema";

export type CreateUploadInput = {
  userId: string;
  imageUrl: string;
  blobPathname: string;
  score: number;
  label: string;
  expressions: Record<string, number>;
  coach?: string | null;
};

export async function createUpload(
  input: CreateUploadInput,
  db: Db = getDb(),
): Promise<Upload> {
  const row: Upload = {
    id: crypto.randomUUID(),
    userId: input.userId,
    imageUrl: input.imageUrl,
    blobPathname: input.blobPathname,
    score: input.score,
    label: input.label,
    expressions: JSON.stringify(input.expressions),
    coach: input.coach ?? null,
    createdAt: new Date(),
  };
  await db.insert(uploads).values(row);
  return row;
}

export async function listUploadsByUser(
  userId: string,
  limit = 20,
  db: Db = getDb(),
): Promise<Upload[]> {
  return db
    .select()
    .from(uploads)
    .where(eq(uploads.userId, userId))
    // rowid breaks ties for rows created in the same millisecond (SQLite insertion order).
    .orderBy(desc(uploads.createdAt), desc(sql`rowid`))
    .limit(limit);
}
