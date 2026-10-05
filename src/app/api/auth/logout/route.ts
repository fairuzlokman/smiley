import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { json } from "@/lib/http";

export async function POST() {
  const response = json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
