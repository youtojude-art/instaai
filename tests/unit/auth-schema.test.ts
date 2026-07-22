import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("validates email and password", () => {
    const result = loginSchema.safeParse({
      email: "staff@example.com",
      password: "password123"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid input", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "short"
    });

    expect(result.success).toBe(false);
  });
});
