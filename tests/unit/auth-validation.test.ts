import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("normalises the email", () => {
    const result = registerSchema.parse({ email: "  Jane@Example.COM ", password: "longenough" });
    expect(result.email).toBe("jane@example.com");
  });

  it("rejects short passwords and bad emails", () => {
    expect(registerSchema.safeParse({ email: "nope", password: "longenough" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("only requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
