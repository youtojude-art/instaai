import { describe, expect, it } from "vitest";
import { analyzeProjectMetricsSchema, upsertPostMetricSchema } from "@/lib/validations/metric";

const id = "00000000-0000-4000-8000-000000000001";

describe("metric schemas", () => {
  it("accepts manual metric input", () => {
    const result = upsertPostMetricSchema.safeParse({
      postId: id,
      instagramUrl: "https://www.instagram.com/p/example/",
      measuredAt: "2026-07-23T18:30",
      reach: "1000",
      impressions: "1200",
      likes: "80",
      comments: "4",
      saves: "12",
      shares: "3",
      videoViews: "0",
      profileAccesses: "20",
      websiteClicks: "5",
      lineAdds: "2",
      inquiries: "1",
      reservations: "1",
      purchases: "0",
      salesAmount: "0",
      notes: "保存率が良い"
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative metric values", () => {
    const result = upsertPostMetricSchema.safeParse({
      postId: id,
      reach: "-1",
      impressions: "0",
      likes: "0",
      comments: "0",
      saves: "0",
      shares: "0",
      videoViews: "0",
      profileAccesses: "0",
      websiteClicks: "0",
      lineAdds: "0",
      inquiries: "0",
      reservations: "0",
      purchases: "0",
      salesAmount: "0"
    });

    expect(result.success).toBe(false);
  });

  it("accepts project metric analysis input", () => {
    const result = analyzeProjectMetricsSchema.safeParse({
      projectId: id
    });

    expect(result.success).toBe(true);
  });
});
