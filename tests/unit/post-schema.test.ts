import { describe, expect, it } from "vitest";
import {
  generatePostImageSchema,
  saveChatMessageAsPostSchema,
  submitPostApprovalSchema,
  updatePostContentSchema,
  updatePostStatusSchema
} from "@/lib/validations/post";

const id = "00000000-0000-4000-8000-000000000001";

describe("post schemas", () => {
  it("accepts a chat message id for post saving", () => {
    const result = saveChatMessageAsPostSchema.safeParse({ messageId: id });

    expect(result.success).toBe(true);
  });

  it("accepts a post status update", () => {
    const result = updatePostStatusSchema.safeParse({ postId: id, status: "planning" });

    expect(result.success).toBe(true);
  });

  it("accepts post content updates", () => {
    const result = updatePostContentSchema.safeParse({
      postId: id,
      title: "投稿タイトル",
      caption: "本文",
      cta: "来店してください",
      hashtags: "#ランチ #ハンバーガー",
      scheduledAt: "2026-07-23T18:30"
    });

    expect(result.success).toBe(true);
  });

  it("accepts post approval actions", () => {
    const result = submitPostApprovalSchema.safeParse({
      postId: id,
      action: "approved",
      note: "内容確認済み"
    });

    expect(result.success).toBe(true);
  });

  it("accepts post image generation inputs", () => {
    const result = generatePostImageSchema.safeParse({
      postId: id,
      format: "feed",
      extraPrompt: "商品を中央に大きく配置"
    });

    expect(result.success).toBe(true);
  });
});
