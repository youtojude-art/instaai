import { describe, expect, it } from "vitest";
import { createProjectSchema } from "@/lib/validations/project";

describe("createProjectSchema", () => {
  it("accepts a valid project", () => {
    const result = createProjectSchema.safeParse({
      name: "自社広報アカウント",
      companyName: "自社",
      shopName: "",
      industry: "広報"
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing project name", () => {
    const result = createProjectSchema.safeParse({
      name: "",
      companyName: "",
      shopName: "",
      industry: ""
    });

    expect(result.success).toBe(false);
  });
});
