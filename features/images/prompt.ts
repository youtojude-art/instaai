import type { ContentPostDetail } from "@/features/posts/queries";

export function createDefaultImageDirection(post: ContentPostDetail) {
  const headline = post.title.trim();
  const cta = post.cta?.trim();
  const captionHint = summarizeCaption(post.caption);
  const projectName = post.projects?.name ?? "案件";

  return [
    `目的: ${projectName}のInstagram投稿として、${headline}の内容が一目で伝わる高品質な投稿画像にする。`,
    "",
    "ビジュアル方針:",
    "- 写真広告風、自然光、清潔感、余白多め、商品またはサービスの魅力が中央に伝わる構図",
    "- 日本のInstagramビジネスアカウントに合う、上品で信頼感のあるトーン",
    "- 背景は整理されていて、主役が埋もれないこと",
    "- 文字は基本なし。入れる場合は短い日本語見出しのみで、大きく読みやすくする",
    "",
    "構図:",
    "- フィードでは中央に主役、周囲に余白、スクロール中でも目に留まる明暗差",
    "- ストーリーでは上部と下部にUI用の安全余白を確保し、縦方向に視線誘導を作る",
    "",
    "避けること:",
    "- 安っぽい素材感、過度な装飾、意味のない図形、文字詰め込み、読めない小さい文字",
    "- 架空ロゴ、実在ブランドロゴ、透かし、UIスクリーンショット風、コラージュ風",
    "",
    "投稿内容の反映:",
    `- 投稿タイトル: ${headline}`,
    captionHint ? `- 本文要約: ${captionHint}` : "",
    cta ? `- CTAの雰囲気: ${cta}` : "",
    `- 投稿形式: ${post.content_type}`
  ]
    .filter(Boolean)
    .join("\n");
}

function summarizeCaption(caption: string | null) {
  if (!caption) {
    return "";
  }

  return caption.replace(/\s+/g, " ").trim().slice(0, 180);
}
