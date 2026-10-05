import { eq } from "drizzle-orm";
import { getDb, type Db } from "@/db";
import { users, type User } from "@/db/schema";

export async function findUserByEmail(
  email: string,
  db: Db = getDb(),
): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function findUserById(
  id: string,
  db: Db = getDb(),
): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function createUser(
  input: { email: string; passwordHash: string },
  db: Db = getDb(),
): Promise<User> {
  const user: User = {
    id: crypto.randomUUID(),
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: new Date(),
  };
  await db.insert(users).values(user);
  return user;
}
