import { parseJsonBody } from "@/lib/auth/parseBody";
import { registerUser } from "@/lib/auth/service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { json, jsonError } from "@/lib/http";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const input = await parseJsonBody(request, registerSchema);
    const { session, token } = await registerUser(input);

    const response = json({ user: session }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    return jsonError(err);
  }
}
