"use server";

import { getProjectWorkspace } from "@/features/projects/queries";
import { generateAiReply } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";
import { generateMonthlyReportSchema } from "@/lib/validations/report";

type ActionResult = {
  ok: boolean;
  message: string;
};

type MonthlyReportMetricRow = {
  measured_at: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  video_views: number;
  profile_accesses: number;
  website_clicks: number;
  line_adds: number;
  inquiries: number;
  reservations: number;
  purchases: number;
  sales_amount: number;
  notes: string | null;
  content_posts: {
    title: string;
    content_type: string;
    status: string;
    caption: string | null;
    cta: string | null;
    hashtags: string[] | null;
  } | null;
};

export async function generateMonthlyReport(formData: FormData): Promise<ActionResult> {
  const parsed = generateMonthlyReportSchema.safeParse({
    projectId: formData.get("projectId"),
    month: formData.get("month")
  });

  if (!parsed.success) {
    return { ok: false, message: "案件と対象月を選択してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const monthRange = getMonthRange(parsed.data.month);
  const { data, error } = await supabase
    .from("post_metrics")
    .select("measured_at,reach,impressions,likes,comments,saves,shares,video_views,profile_accesses,website_clicks,line_adds,inquiries,reservations,purchases,sales_amount,notes,content_posts(title,content_type,status,caption,cta,hashtags)")
    .eq("project_id", parsed.data.projectId)
    .is("deleted_at", null)
    .gte("measured_at", monthRange.start.toISOString())
    .lt("measured_at", monthRange.end.toISOString())
    .order("measured_at", { ascending: true })
    .limit(50);

  if (error) {
    return { ok: false, message: `月次レポート用の実績を取得できませんでした: ${error.message}` };
  }

  if (!data || data.length === 0) {
    return { ok: false, message: "この月には、まだレポート生成できる投稿実績がありません。" };
  }

  const rows = (data as unknown as MonthlyReportMetricRow[]).map((row) => ({
    ...row,
    content_posts: Array.isArray(row.content_posts) ? row.content_posts[0] ?? null : row.content_posts
  }));
  const workspace = await getProjectWorkspace(parsed.data.projectId);
  const aiResult = await generateAiReply({
    systemPrompt: createMonthlyReportSystemPrompt(workspace),
    userPrompt: createMonthlyReportUserPrompt(parsed.data.month, rows)
  });

  if (!aiResult.ok) {
    return { ok: false, message: `月次レポート生成に失敗しました: ${aiResult.message}` };
  }

  return { ok: true, message: aiResult.text };
}

function getMonthRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  return {
    start: new Date(year, monthIndex, 1),
    end: new Date(year, monthIndex + 1, 1)
  };
}

function createMonthlyReportSystemPrompt(workspace: Awaited<ReturnType<typeof getProjectWorkspace>>) {
  return [
    "あなたはInstagram運用の月次レポートを作成するAIディレクターです。",
    "入力された投稿実績をもとに、社内報告と翌月運用に使える月次レポートを日本語で作成してください。",
    "数値から読める事実、改善仮説、翌月の具体施策を分けてください。",
    "事務スタッフがそのままクライアント報告や社内共有のたたき台にできる丁寧な文体にしてください。",
    "",
    "【案件情報】",
    `案件名: ${workspace.project?.name ?? "未設定"}`,
    `会社名: ${workspace.project?.company_name ?? "未設定"}`,
    `業種: ${workspace.project?.industry ?? "未設定"}`,
    "",
    "【ブランド・ターゲット】",
    `ブランドコンセプト: ${workspace.brandProfile?.concept ?? "未設定"}`,
    `ブランドトーン: ${workspace.brandProfile?.tone ?? "未設定"}`,
    `必須訴求: ${workspace.brandProfile?.required_appeals ?? "未設定"}`,
    `禁止表現: ${workspace.brandProfile?.prohibited_words ?? "未設定"}`,
    `ターゲット: ${workspace.targetProfile?.name ?? "未設定"}`,
    `悩み: ${workspace.targetProfile?.pains ?? "未設定"}`,
    `欲求: ${workspace.targetProfile?.desires ?? "未設定"}`,
    "",
    "【出力形式】",
    "1. 月間サマリー",
    "2. 主要KPI",
    "3. 良かった投稿",
    "4. 改善が必要な投稿",
    "5. 今月の学び",
    "6. 翌月の投稿方針",
    "7. 翌月の投稿テーマ案",
    "8. 事務スタッフの作業リスト"
  ].join("\n");
}

function createMonthlyReportUserPrompt(month: string, rows: MonthlyReportMetricRow[]) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.reach += row.reach;
      acc.impressions += row.impressions;
      acc.likes += row.likes;
      acc.comments += row.comments;
      acc.saves += row.saves;
      acc.shares += row.shares;
      acc.videoViews += row.video_views;
      acc.profileAccesses += row.profile_accesses;
      acc.websiteClicks += row.website_clicks;
      acc.lineAdds += row.line_adds;
      acc.inquiries += row.inquiries;
      acc.reservations += row.reservations;
      acc.purchases += row.purchases;
      acc.salesAmount += row.sales_amount;
      return acc;
    },
    {
      reach: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      videoViews: 0,
      profileAccesses: 0,
      websiteClicks: 0,
      lineAdds: 0,
      inquiries: 0,
      reservations: 0,
      purchases: 0,
      salesAmount: 0
    }
  );
  const engagement = totals.likes + totals.comments + totals.saves + totals.shares;
  const engagementRate = totals.reach > 0 ? ((engagement / totals.reach) * 100).toFixed(1) : "0.0";
  const saveRate = totals.reach > 0 ? ((totals.saves / totals.reach) * 100).toFixed(1) : "0.0";
  const clickRate = totals.reach > 0 ? ((totals.websiteClicks / totals.reach) * 100).toFixed(1) : "0.0";

  return [
    `${month} の月次レポートを作成してください。`,
    "",
    "【月間集計】",
    `投稿実績入力数: ${rows.length}`,
    `合計リーチ: ${totals.reach}`,
    `合計表示回数: ${totals.impressions}`,
    `合計いいね: ${totals.likes}`,
    `合計コメント: ${totals.comments}`,
    `合計保存: ${totals.saves}`,
    `合計シェア: ${totals.shares}`,
    `合計動画再生: ${totals.videoViews}`,
    `合計プロフィールアクセス: ${totals.profileAccesses}`,
    `合計Webクリック: ${totals.websiteClicks}`,
    `合計LINE追加: ${totals.lineAdds}`,
    `合計問い合わせ: ${totals.inquiries}`,
    `合計予約: ${totals.reservations}`,
    `合計購入: ${totals.purchases}`,
    `合計売上金額: ${totals.salesAmount}`,
    `反応率: ${engagementRate}%`,
    `保存率: ${saveRate}%`,
    `クリック率: ${clickRate}%`,
    "",
    "【投稿別実績】",
    ...rows.map((row, index) => {
      const rowEngagement = row.likes + row.comments + row.saves + row.shares;
      const rowEngagementRate = row.reach > 0 ? ((rowEngagement / row.reach) * 100).toFixed(1) : "0.0";
      const rowSaveRate = row.reach > 0 ? ((row.saves / row.reach) * 100).toFixed(1) : "0.0";

      return [
        `--- 投稿${index + 1} ---`,
        `タイトル: ${row.content_posts?.title ?? "未設定"}`,
        `形式: ${row.content_posts?.content_type ?? "未設定"}`,
        `状態: ${row.content_posts?.status ?? "未設定"}`,
        `計測日時: ${row.measured_at}`,
        `本文: ${row.content_posts?.caption ?? "未設定"}`,
        `CTA: ${row.content_posts?.cta ?? "未設定"}`,
        `ハッシュタグ: ${(row.content_posts?.hashtags ?? []).join(" ") || "未設定"}`,
        `リーチ: ${row.reach}`,
        `表示回数: ${row.impressions}`,
        `いいね: ${row.likes}`,
        `コメント: ${row.comments}`,
        `保存: ${row.saves}`,
        `シェア: ${row.shares}`,
        `動画再生: ${row.video_views}`,
        `プロフィールアクセス: ${row.profile_accesses}`,
        `Webクリック: ${row.website_clicks}`,
        `LINE追加: ${row.line_adds}`,
        `問い合わせ: ${row.inquiries}`,
        `予約: ${row.reservations}`,
        `購入: ${row.purchases}`,
        `売上金額: ${row.sales_amount}`,
        `反応率: ${rowEngagementRate}%`,
        `保存率: ${rowSaveRate}%`,
        `運用メモ: ${row.notes ?? "なし"}`
      ].join("\n");
    })
  ].join("\n");
}
