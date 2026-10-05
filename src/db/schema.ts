import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const uploads = sqliteTable(
  "uploads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    /** Storage key so the file can be deleted later. */
    blobPathname: text("blob_pathname").notNull(),
    score: integer("score").notNull(),
    label: text("label").notNull(),
    /** JSON string of the 7 expression probabilities, kept for debugging/explainability. */
    expressions: text("expressions").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("uploads_user_id_idx").on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
