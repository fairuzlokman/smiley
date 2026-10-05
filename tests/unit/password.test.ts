import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("never stores the plain password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("secret-password");
    await expect(verifyPassword("secret-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("Secret-password", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
  });
});
