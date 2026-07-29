import { describe, expect, it } from "vitest";
import { createLineInstructionMessage } from "@/features/posts/line-message";
import type { ContentPostDetail } from "@/features/posts/queries";

const basePost: ContentPostDetail = {
  id: "post-1",
  project_id: "project-1",
  title: "夏キャンペーン告知",
  content_type: "image",
  category: null,
  objective: null,
  status: "scheduled",
  priority: "medium",
  scheduled_at: "2026-07-30T10:00:00.000+09:00",
  caption: "夏限定メニューのお知らせです。",
  cta: "詳細はプロフィールから",
  hashtags: ["#夏キャンペーン", "#美容"],
  ai_payload: null,
  created_at: "2026-07-29T00:00:00.000Z",
  updated_at: "2026-07-29T00:00:00.000Z",
  projects: {
    name: "サンプル案件"
  }
};

describe("createLineInstructionMessage", () => {
  it("creates a client-ready LINE message", () => {
    const message = createLineInstructionMessage(basePost);

    expect(message).toContain("Instagram投稿の予約内容を共有いたします。");
    expect(message).toContain("【案件】サンプル案件");
    expect(message).toContain("【投稿タイトル】夏キャンペーン告知");
    expect(message).toContain("夏限定メニューのお知らせです。");
    expect(message).toContain("#夏キャンペーン #美容");
  });

  it("uses fallback text for missing optional fields", () => {
    const message = createLineInstructionMessage({
      ...basePost,
      scheduled_at: null,
      caption: null,
      cta: null,
      hashtags: []
    });

    expect(message).toContain("【投稿予定】未設定");
    expect(message).toContain("【投稿本文】\n未設定");
    expect(message).toContain("【CTA】\n未設定");
    expect(message).toContain("【ハッシュタグ】\n未設定");
  });
});
