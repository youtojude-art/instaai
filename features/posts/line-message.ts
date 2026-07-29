import type { ContentPostDetail } from "@/features/posts/queries";

const typeLabels: Record<ContentPostDetail["content_type"], string> = {
  carousel: "カルーセル",
  reel: "リール",
  story: "ストーリーズ",
  image: "画像",
  other: "その他"
};

export function createLineInstructionMessage(post: ContentPostDetail) {
  const lines = [
    "お世話になっております。",
    "Instagram投稿の予約内容を共有いたします。",
    "",
    `【案件】${post.projects?.name ?? "案件未設定"}`,
    `【投稿タイトル】${post.title}`,
    `【投稿形式】${typeLabels[post.content_type] ?? post.content_type}`,
    `【投稿予定】${post.scheduled_at ? formatDateTime(post.scheduled_at) : "未設定"}`,
    "",
    "【投稿本文】",
    post.caption?.trim() || "未設定",
    "",
    "【CTA】",
    post.cta?.trim() || "未設定",
    "",
    "【ハッシュタグ】",
    post.hashtags.length > 0 ? post.hashtags.join(" ") : "未設定",
    "",
    "上記内容で投稿予約を進めております。",
    "修正がある場合は、このLINEにてご返信ください。"
  ];

  return lines.join("\n");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
