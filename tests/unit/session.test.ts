import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { readCookie, signSession, verifySession } from "@/lib/auth/session";

const payload = { userId: "user-1", email: "a@example.com" };

describe("session tokens", () => {
  it("round-trips a payload", async () => {
    const token = await signSession(payload);
    await expect(verifySession(token)).resolves.toEqual(payload);
  });

  it("rejects a missing or malformed token", async () => {
    await expect(verifySession(undefined)).resolves.toBeNull();
    await expect(verifySession("not-a-jwt")).resolves.toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(payload);
    const [header, , sig] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ sub: "someone-else", email: "evil@example.com" }),
    ).toString("base64url");
    await expect(verifySession(`${header}.${forgedBody}.${sig}`)).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const other = await new SignJWT({ email: payload.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.userId)
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("another-secret-that-is-also-32-characters-long"));
    await expect(verifySession(other)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ email: payload.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.userId)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    await expect(verifySession(expired)).resolves.toBeNull();
  });
});

describe("readCookie", () => {
  it("finds a cookie by name among several", () => {
    expect(readCookie("a=1; session=abc.def; b=2", "session")).toBe("abc.def");
  });

  it("returns undefined for a missing header or name", () => {
    expect(readCookie(null, "session")).toBeUndefined();
    expect(readCookie("a=1", "session")).toBeUndefined();
  });

  it("decodes URL-encoded values", () => {
    expect(readCookie("session=a%3Db", "session")).toBe("a=b");
  });
});
