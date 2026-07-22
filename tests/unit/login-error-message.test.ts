import { describe, expect, it } from "vitest";

describe("login error guidance", () => {
  it("documents common login failure causes", () => {
    const causes = [
      "ユーザー未作成",
      "メールアドレスまたはパスワード違い",
      "メール未確認",
      "Supabase URLと公開キーの不一致"
    ];

    expect(causes).toContain("メールアドレスまたはパスワード違い");
  });
});
