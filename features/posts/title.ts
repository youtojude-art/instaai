type ContentType = "carousel" | "reel" | "story" | "image" | "other";

const contentTypeLabels: Record<ContentType, string> = {
  carousel: "カルーセル",
  reel: "リール",
  story: "ストーリーズ",
  image: "画像",
  other: "投稿"
};

const genericLinePatterns = [
  /^承知しました/,
  /^かしこまりました/,
  /^もちろん/,
  /^以下/,
  /^こちら/,
  /^では/,
  /^投稿案$/,
  /^投稿文$/,
  /^キャプション$/,
  /^ハッシュタグ$/,
  /^cta$/i,
  /^ポイント$/,
  /^構成$/,
  /^必要素材$/,
  /予約は/,
  /プロフィール.*リンク/,
  /お問い合わせ/,
  /問い合わせ/,
  /来店/,
  /申し込み/
];

export function createPostTitleFromContent(content: string, contentType: ContentType) {
  const lines = normalizeLines(content);
  const explicitTitle = findExplicitTitle(lines);
  const theme = explicitTitle ?? findThemeLine(lines) ?? inferThemeFromContent(content) ?? "AIチャット投稿案";
  const cleanedTheme = trimTitle(theme);
  const prefix = contentTypeLabels[contentType];

  if (cleanedTheme.startsWith(`${prefix}｜`) || cleanedTheme.startsWith(`${prefix}:`)) {
    return cleanedTheme;
  }

  return trimTitle(`${prefix}｜${cleanedTheme}`);
}

function normalizeLines(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*・]\s*/, "")
        .replace(/^\d+[.)．]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function findExplicitTitle(lines: string[]) {
  for (const line of lines) {
    const matched = line.match(/^(?:投稿タイトル|タイトル|件名|テーマ|企画名|見出し)\s*[:：]\s*(.+)$/);
    if (matched?.[1]) {
      return matched[1];
    }
  }

  return null;
}

function findThemeLine(lines: string[]) {
  return lines.find((line) => {
    const normalized = line.toLowerCase();
    return (
      line.length >= 6 &&
      line.length <= 80 &&
      !genericLinePatterns.some((pattern) => pattern.test(line)) &&
      !normalized.startsWith("http") &&
      !line.startsWith("#") &&
      !/^【?(本文|caption|ハッシュタグ|hashtags|cta|注意|補足)】?/i.test(line)
    );
  });
}

function inferThemeFromContent(content: string) {
  const compact = content.replace(/\s+/g, " ");
  const hashtag = content.match(/#[\p{Letter}\p{Number}_ぁ-んァ-ヶ一-龠ー]+/u)?.[0]?.replace("#", "");

  if (/キャンペーン|限定|割引|特典/.test(compact)) return "限定キャンペーン告知";
  if (/予約|問い合わせ|来店|申し込み/.test(compact)) return "予約・問い合わせ促進";
  if (/新商品|新メニュー|新サービス/.test(compact)) return "新メニュー紹介";
  if (/実績|事例|お客様の声|口コミ/.test(compact)) return "実績・お客様の声紹介";
  if (/悩み|課題|解決|改善/.test(compact)) return "悩み解決訴求";
  if (hashtag) return `${hashtag}投稿案`;

  return null;
}

function trimTitle(value: string) {
  const cleaned = value
    .replace(/^["'「『【\s]+|["'」』】\s]+$/g, "")
    .replace(/^(?:投稿タイトル|タイトル|件名|テーマ|企画名|見出し)\s*[:：]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= 64) {
    return cleaned;
  }

  const shortened = cleaned.slice(0, 64);
  const naturalBreak = Math.max(
    shortened.lastIndexOf("。"),
    shortened.lastIndexOf("、"),
    shortened.lastIndexOf("！"),
    shortened.lastIndexOf("？"),
    shortened.lastIndexOf(" ")
  );

  return `${shortened.slice(0, naturalBreak > 20 ? naturalBreak : 61)}...`;
}
