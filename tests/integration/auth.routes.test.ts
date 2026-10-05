import { describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { POST as register } from "@/app/api/auth/register/route";
import { verifySession } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/repositories/users";
import { setupTestDatabase } from "./helpers/db";
import { cookieFrom, jsonRequest } from "./helpers/request";

setupTestDatabase();

const credentials = { email: "jane@example.com", password: "longenough1" };

describe("POST /api/auth/register", () => {
  it("creates the user, hashes the password and sets a session cookie", async () => {
    const res = await register(jsonRequest("/api/auth/register", credentials));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.user.email).toBe(credentials.email);

    const user = await findUserByEmail(credentials.email);
    expect(user).toBeDefined();
    expect(user!.passwordHash).not.toBe(credentials.password);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);

    const token = cookieFrom(res).split("=")[1];
    await expect(verifySession(token)).resolves.toEqual({
      userId: user!.id,
      email: credentials.email,
    });
  });

  it("normalises the email before saving", async () => {
    await register(jsonRequest("/api/auth/register", { ...credentials, email: " Jane@Example.com " }));
    expect(await findUserByEmail("jane@example.com")).toBeDefined();
  });

  it("returns 409 for a duplicate email", async () => {
    await register(jsonRequest("/api/auth/register", credentials));
    const res = await register(jsonRequest("/api/auth/register", credentials));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already registered/i);
  });

  it("returns 400 with field errors for invalid input", async () => {
    const res = await register(jsonRequest("/api/auth/register", { email: "nope", password: "short" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details.fieldErrors.email).toBeDefined();
    expect(body.details.fieldErrors.password).toBeDefined();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await register(jsonRequest("/api/auth/register", "not json"));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with the right password", async () => {
    await register(jsonRequest("/api/auth/register", credentials));
    const res = await login(jsonRequest("/api/auth/login", credentials));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/^session=/);
    expect((await res.json()).user.email).toBe(credentials.email);
  });

  it("returns the same 401 for a wrong password and an unknown email", async () => {
    await register(jsonRequest("/api/auth/register", credentials));
    const wrongPassword = await login(jsonRequest("/api/auth/login", { ...credentials, password: "wrong-pass" }));
    const unknownEmail = await login(jsonRequest("/api/auth/login", { ...credentials, email: "nobody@example.com" }));

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect((await wrongPassword.json()).error).toBe((await unknownEmail.json()).error);
    expect(wrongPassword.headers.get("set-cookie")).toBeNull();
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await logout();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/^session=;/);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});
