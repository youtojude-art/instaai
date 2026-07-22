import { describe, expect, it } from "vitest";
import { createPostTitleFromContent } from "@/features/posts/title";

describe("post title generation", () => {
  it("uses an explicit title when present", () => {
    const title = createPostTitleFromContent(
      [
        "承知しました。以下で作成します。",
        "投稿タイトル: 夏限定ランチの予約促進",
        "本文: 夏野菜を使った限定ランチを紹介します。"
      ].join("\n"),
      "image"
    );

    expect(title).toBe("画像｜夏限定ランチの予約促進");
  });

  it("skips generic assistant openings", () => {
    const title = createPostTitleFromContent(
      [
        "承知しました。投稿案を作成します。",
        "夏限定メニューの魅力を伝える投稿",
        "本文: 旬の野菜を使ったランチです。"
      ].join("\n"),
      "carousel"
    );

    expect(title).toBe("カルーセル｜夏限定メニューの魅力を伝える投稿");
  });

  it("falls back to a useful inferred title", () => {
    const title = createPostTitleFromContent("ご予約はプロフィールリンクからお願いします。 #ランチ", "story");

    expect(title).toBe("ストーリーズ｜予約・問い合わせ促進");
  });
});
