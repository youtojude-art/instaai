import { describe, expect, it } from "vitest";
import { createDefaultImageDirection } from "@/features/images/prompt";
import type { ContentPostDetail } from "@/features/posts/queries";

describe("image prompt", () => {
  it("creates a detailed default image direction from post content", () => {
    const prompt = createDefaultImageDirection({
      id: "00000000-0000-4000-8000-000000000001",
      project_id: "00000000-0000-4000-8000-000000000002",
      title: "夏限定ランチの告知",
      content_type: "image",
      category: null,
      objective: null,
      status: "idea",
      priority: "medium",
      scheduled_at: null,
      caption: "夏野菜を使ったランチメニューを紹介します。",
      cta: "プロフィールのリンクから予約",
      hashtags: ["#ランチ"],
      ai_payload: null,
      created_at: "2026-07-23T00:00:00.000Z",
      updated_at: "2026-07-23T00:00:00.000Z",
      projects: {
        name: "テスト案件"
      }
    } satisfies ContentPostDetail);

    expect(prompt).toContain("夏限定ランチの告知");
    expect(prompt).toContain("写真広告風");
    expect(prompt).toContain("避けること");
  });
});
