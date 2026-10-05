import { ApiError } from "@/lib/http";
import { createUser, findUserByEmail } from "@/lib/repositories/users";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";
import { hashPassword, verifyPassword } from "./password";
import { signSession, type SessionPayload } from "./session";

/**
 * Auth use-cases, independent of HTTP. Route handlers only parse input and
 * set cookies; everything that could be unit-tested lives here.
 */
export async function registerUser(
  input: RegisterInput,
): Promise<{ session: SessionPayload; token: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ApiError(409, "This email is already registered. Try logging in instead.");
  }

  const passwordHash = await hashPassword(input.password);
  let user;
  try {
    user = await createUser({ email: input.email, passwordHash });
  } catch (err) {
    // Two registrations racing for the same email: the unique index wins.
    if (isUniqueViolation(err)) {
      throw new ApiError(409, "This email is already registered. Try logging in instead.");
    }
    throw err;
  }

  const session = { userId: user.id, email: user.email };
  return { session, token: await signSession(session) };
}

export async function loginUser(
  input: LoginInput,
): Promise<{ session: SessionPayload; token: string }> {
  const user = await findUserByEmail(input.email);
  // Same message for unknown email and wrong password so emails can't be enumerated.
  const invalid = new ApiError(401, "Incorrect email or password.");
  if (!user) throw invalid;

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw invalid;

  const session = { userId: user.id, email: user.email };
  return { session, token: await signSession(session) };
}

function isUniqueViolation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed/i.test(message);
}
