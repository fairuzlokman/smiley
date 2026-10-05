import { parseJsonBody } from "@/lib/auth/parseBody";
import { loginUser } from "@/lib/auth/service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { json, jsonError } from "@/lib/http";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, loginSchema);
    const { session, token } = await loginUser(input);

    const response = json({ user: session });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    return jsonError(err);
  }
}
