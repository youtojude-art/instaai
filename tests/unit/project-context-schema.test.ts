import { describe, expect, it } from "vitest";
import { aiEmployeeSchema, brandProfileSchema, referenceAccountSchema, targetProfileSchema } from "@/lib/validations/project-context";

const projectId = "00000000-0000-4000-8000-000000000001";

describe("project context schemas", () => {
  it("accepts brand profile input", () => {
    const result = brandProfileSchema.safeParse({
      projectId,
      concept: "親しみやすく信頼感のある発信",
      tone: "明るい",
      speakingRules: "敬語で短め",
      requiredAppeals: "LINE登録",
      prohibitedWords: "絶対",
      legalNotes: "根拠のない断定を避ける",
      colors: "ピンク、白",
      fonts: "Noto Sans JP"
    });

    expect(result.success).toBe(true);
  });

  it("accepts target profile input", () => {
    const result = targetProfileSchema.safeParse({
      projectId,
      name: "メインターゲット",
      ageRange: "30代",
      gender: "女性",
      area: "東京都",
      occupation: "会社員",
      lifestyle: "平日は忙しい",
      pains: "選び方が分からない",
      desires: "信頼できる人に相談したい",
      behaviorNotes: "LINE登録"
    });

    expect(result.success).toBe(true);
  });

  it("accepts ai employee input", () => {
    const result = aiEmployeeSchema.safeParse({
      projectId,
      name: "インスタ運用AI",
      personality: "丁寧",
      speakingStyle: "結論から話す",
      taskScope: "投稿企画作成\n投稿文章作成",
      writingAmount: "medium",
      emojiAmount: "low",
      salesTone: "medium",
      proactiveSuggestions: "true"
    });

    expect(result.success).toBe(true);
  });

  it("accepts reference account input", () => {
    const result = referenceAccountSchema.safeParse({
      projectId,
      accountName: "参考アカウント",
      accountUrl: "https://www.instagram.com/example/",
      reason: "世界観が近い",
      strengths: "冒頭の見せ方が強い",
      visualNotes: "余白が多い",
      contentNotes: "悩み提示から始まる",
      avoidNotes: "煽りは真似しない",
      applyNotes: "構成だけ参考にする"
    });

    expect(result.success).toBe(true);
  });
});
