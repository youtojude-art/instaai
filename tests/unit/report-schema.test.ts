import { describe, expect, it } from "vitest";
import { generateMonthlyReportSchema } from "@/lib/validations/report";

const id = "00000000-0000-4000-8000-000000000001";

describe("report schemas", () => {
  it("accepts monthly report input", () => {
    const result = generateMonthlyReportSchema.safeParse({
      projectId: id,
      month: "2026-07"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid month values", () => {
    const result = generateMonthlyReportSchema.safeParse({
      projectId: id,
      month: "2026/07"
    });

    expect(result.success).toBe(false);
  });
});
