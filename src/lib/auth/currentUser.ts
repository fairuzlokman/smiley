import { cookies } from "next/headers";
import {
  readCookie,
  SESSION_COOKIE,
  verifySession,
  type SessionPayload,
} from "./session";

/** For route handlers: reads the session from the raw request so it is testable without Next's request context. */
export async function getUserFromRequest(
  request: Request,
): Promise<SessionPayload | null> {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  return verifySession(token);
}

/** For server components: reads the session from Next's cookie store. */
export async function getUserFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
