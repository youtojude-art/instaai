"use server";

import { revalidatePath } from "next/cache";
import { getProjectWorkspace } from "@/features/projects/queries";
import { generateAiReply } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";
import { analyzeProjectMetricsSchema, upsertPostMetricSchema } from "@/lib/validations/metric";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function upsertPostMetric(formData: FormData): Promise<ActionResult> {
  const parsed = upsertPostMetricSchema.safeParse({
    postId: formData.get("postId"),
    instagramUrl: formData.get("instagramUrl"),
    measuredAt: formData.get("measuredAt"),
    reach: formData.get("reach"),
    impressions: formData.get("impressions"),
    likes: formData.get("likes"),
    comments: formData.get("comments"),
    saves: formData.get("saves"),
    shares: formData.get("shares"),
    videoViews: formData.get("videoViews"),
    profileAccesses: formData.get("profileAccesses"),
    websiteClicks: formData.get("websiteClicks"),
    lineAdds: formData.get("lineAdds"),
    inquiries: formData.get("inquiries"),
    reservations: formData.get("reservations"),
    purchases: formData.get("purchases"),
    salesAmount: formData.get("salesAmount"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { ok: false, message: "投稿実績の入力内容を確認してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const { data: post, error: postError } = await supabase
    .from("content_posts")
    .select("id,project_id")
    .eq("id", parsed.data.postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (postError || !post) {
    return { ok: false, message: `投稿を取得できませんでした: ${postError?.message ?? "not found"}` };
  }

  const { error } = await supabase
    .from("post_metrics")
    .upsert(
      {
        project_id: post.project_id,
        post_id: post.id,
        instagram_url: parsed.data.instagramUrl || null,
        measured_at: parseMeasuredAt(parsed.data.measuredAt),
        reach: parsed.data.reach,
        impressions: parsed.data.impressions,
        likes: parsed.data.likes,
        comments: parsed.data.comments,
        saves: parsed.data.saves,
        shares: parsed.data.shares,
        video_views: parsed.data.videoViews,
        profile_accesses: parsed.data.profileAccesses,
        website_clicks: parsed.data.websiteClicks,
        line_adds: parsed.data.lineAdds,
        inquiries: parsed.data.inquiries,
        reservations: parsed.data.reservations,
        purchases: parsed.data.purchases,
        sales_amount: parsed.data.salesAmount,
        source: "manual",
        notes: parsed.data.notes || null,
        created_by: user.id
      },
      { onConflict: "post_id" }
    );

  if (error) {
    return { ok: false, message: `投稿実績を保存できませんでした: ${error.message}` };
  }

  revalidatePath("/metrics");
  revalidatePath(`/posts/${post.id}`);
  return { ok: true, message: "投稿実績を保存しました。" };
}

export async function analyzePostMetric(formData: FormData): Promise<ActionResult> {
  const postId = formData.get("postId");

  if (typeof postId !== "string" || !postId) {
    return { ok: false, message: "分析対象の投稿が不正です。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const [{ data: post, error: postError }, { data: metric, error: metricError }] = await Promise.all([
    supabase
      .from("content_posts")
      .select("id,project_id,title,content_type,status,caption,cta,hashtags,scheduled_at,projects(name)")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("post_metrics")
      .select("id,project_id,post_id,instagram_url,measured_at,reach,impressions,likes,comments,saves,shares,video_views,profile_accesses,website_clicks,line_adds,inquiries,reservations,purchases,sales_amount,notes")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .maybeSingle()
  ]);

  if (postError || !post) {
    return { ok: false, message: `投稿を取得できませんでした: ${postError?.message ?? "not found"}` };
  }

  if (metricError || !metric) {
    return { ok: false, message: "先にこの投稿の実績を保存してください。" };
  }

  const workspace = await getProjectWorkspace(post.project_id);
  const aiResult = await generateAiReply({
    systemPrompt: createMetricAnalysisSystemPrompt(workspace),
    userPrompt: createMetricAnalysisUserPrompt({ post, metric })
  });

  if (!aiResult.ok) {
    return { ok: false, message: `実績分析AIの生成に失敗しました: ${aiResult.message}` };
  }

  return { ok: true, message: aiResult.text };
}

export async function analyzeProjectMetrics(formData: FormData): Promise<ActionResult> {
  const parsed = analyzeProjectMetricsSchema.safeParse({
    projectId: formData.get("projectId")
  });

  if (!parsed.success) {
    return { ok: false, message: "分析対象の案件を選択してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const { data: metrics, error } = await supabase
    .from("post_metrics")
    .select("id,project_id,post_id,instagram_url,measured_at,reach,impressions,likes,comments,saves,shares,video_views,profile_accesses,website_clicks,line_adds,inquiries,reservations,purchases,sales_amount,notes,content_posts(title,content_type,status,caption,cta,hashtags)")
    .eq("project_id", parsed.data.projectId)
    .is("deleted_at", null)
    .order("measured_at", { ascending: false })
    .limit(20);

  if (error) {
    return { ok: false, message: `投稿実績を取得できませんでした: ${error.message}` };
  }

  if (!metrics || metrics.length === 0) {
    return { ok: false, message: "この案件には、まだ分析できる投稿実績がありません。" };
  }

  const workspace = await getProjectWorkspace(parsed.data.projectId);
  const normalizedMetrics = (metrics as unknown as ProjectMetricAnalysisRow[]).map((metric) => ({
    ...metric,
    content_posts: Array.isArray(metric.content_posts) ? metric.content_posts[0] ?? null : metric.content_posts
  }));
  const aiResult = await generateAiReply({
    systemPrompt: createProjectMetricAnalysisSystemPrompt(workspace),
    userPrompt: createProjectMetricAnalysisUserPrompt(normalizedMetrics)
  });

  if (!aiResult.ok) {
    return { ok: false, message: `案件実績分析AIの生成に失敗しました: ${aiResult.message}` };
  }

  return { ok: true, message: aiResult.text };
}

function parseMeasuredAt(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function createMetricAnalysisSystemPrompt(workspace: Awaited<ReturnType<typeof getProjectWorkspace>>) {
  return [
    "あなたはInstagram運用の実績分析AIです。",
    "入力された投稿内容と実績値から、次回の改善に直結する提案を日本語で出してください。",
    "社内の事務スタッフがそのまま次の投稿作業に移れるよう、具体的で実務的に書いてください。",
    "根拠のない断定は避け、数値から読めることと仮説を分けてください。",
    "",
    "【案件情報】",
    `案件名: ${workspace.project?.name ?? "未設定"}`,
    `会社名: ${workspace.project?.company_name ?? "未設定"}`,
    `業種: ${workspace.project?.industry ?? "未設定"}`,
    "",
    "【ブランド・ターゲット】",
    `ブランドトーン: ${workspace.brandProfile?.tone ?? "未設定"}`,
    `必須訴求: ${workspace.brandProfile?.required_appeals ?? "未設定"}`,
    `禁止表現: ${workspace.brandProfile?.prohibited_words ?? "未設定"}`,
    `ターゲット: ${workspace.targetProfile?.name ?? "未設定"}`,
    `悩み: ${workspace.targetProfile?.pains ?? "未設定"}`,
    `欲求: ${workspace.targetProfile?.desires ?? "未設定"}`,
    "",
    "【出力形式】",
    "1. 総評",
    "2. 数値から見えること",
    "3. 改善ポイント",
    "4. 次回投稿で試す案",
    "5. そのまま使える次回CTA案",
    "6. 事務スタッフの次アクション"
  ].join("\n");
}

function createProjectMetricAnalysisSystemPrompt(workspace: Awaited<ReturnType<typeof getProjectWorkspace>>) {
  return [
    "あなたはInstagram運用の案件全体を分析するAIディレクターです。",
    "複数投稿の実績を比較し、勝ちパターン、弱点、次に検証すべき施策を具体化してください。",
    "社内の事務スタッフが、翌週または翌月の運用方針として使える粒度で書いてください。",
    "数値から読める事実と、改善仮説を分けてください。",
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
    "1. 全体総評",
    "2. 成果が良い投稿の共通点",
    "3. 伸び悩んだ投稿の改善仮説",
    "4. 次に増やすべき投稿テーマ",
    "5. 次に減らす・直すべき表現や構成",
    "6. 翌週の投稿方針",
    "7. 事務スタッフの具体タスク"
  ].join("\n");
}

function createMetricAnalysisUserPrompt({
  post,
  metric
}: {
  post: {
    title: string;
    content_type: string;
    status: string;
    caption: string | null;
    cta: string | null;
    hashtags: string[] | null;
    scheduled_at: string | null;
  };
  metric: {
    instagram_url: string | null;
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
  };
}) {
  const engagement = metric.likes + metric.comments + metric.saves + metric.shares;
  const engagementRate = metric.reach > 0 ? ((engagement / metric.reach) * 100).toFixed(1) : "0.0";
  const saveRate = metric.reach > 0 ? ((metric.saves / metric.reach) * 100).toFixed(1) : "0.0";
  const clickRate = metric.reach > 0 ? ((metric.website_clicks / metric.reach) * 100).toFixed(1) : "0.0";

  return [
    "以下のInstagram投稿実績を分析してください。",
    "",
    "【投稿情報】",
    `タイトル: ${post.title}`,
    `形式: ${post.content_type}`,
    `ステータス: ${post.status}`,
    `投稿予定日時: ${post.scheduled_at ?? "未設定"}`,
    `本文: ${post.caption ?? "未設定"}`,
    `CTA: ${post.cta ?? "未設定"}`,
    `ハッシュタグ: ${(post.hashtags ?? []).join(" ") || "未設定"}`,
    "",
    "【実績】",
    `Instagram URL: ${metric.instagram_url ?? "未設定"}`,
    `計測日時: ${metric.measured_at}`,
    `リーチ: ${metric.reach}`,
    `表示回数: ${metric.impressions}`,
    `いいね: ${metric.likes}`,
    `コメント: ${metric.comments}`,
    `保存: ${metric.saves}`,
    `シェア: ${metric.shares}`,
    `動画再生: ${metric.video_views}`,
    `プロフィールアクセス: ${metric.profile_accesses}`,
    `Webクリック: ${metric.website_clicks}`,
    `LINE追加: ${metric.line_adds}`,
    `問い合わせ: ${metric.inquiries}`,
    `予約: ${metric.reservations}`,
    `購入: ${metric.purchases}`,
    `売上金額: ${metric.sales_amount}`,
    `反応数: ${engagement}`,
    `反応率: ${engagementRate}%`,
    `保存率: ${saveRate}%`,
    `クリック率: ${clickRate}%`,
    `運用メモ: ${metric.notes ?? "なし"}`,
    "",
    "この投稿の良かった点、弱かった点、次回の改善案を具体的に出してください。"
  ].join("\n");
}

type ProjectMetricAnalysisRow = {
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

function createProjectMetricAnalysisUserPrompt(metrics: ProjectMetricAnalysisRow[]) {
  const totals = metrics.reduce(
    (acc, metric) => {
      acc.reach += metric.reach;
      acc.impressions += metric.impressions;
      acc.engagement += metric.likes + metric.comments + metric.saves + metric.shares;
      acc.saves += metric.saves;
      acc.websiteClicks += metric.website_clicks;
      acc.inquiries += metric.inquiries;
      acc.reservations += metric.reservations;
      acc.salesAmount += metric.sales_amount;
      return acc;
    },
    {
      reach: 0,
      impressions: 0,
      engagement: 0,
      saves: 0,
      websiteClicks: 0,
      inquiries: 0,
      reservations: 0,
      salesAmount: 0
    }
  );
  const engagementRate = totals.reach > 0 ? ((totals.engagement / totals.reach) * 100).toFixed(1) : "0.0";
  const saveRate = totals.reach > 0 ? ((totals.saves / totals.reach) * 100).toFixed(1) : "0.0";
  const clickRate = totals.reach > 0 ? ((totals.websiteClicks / totals.reach) * 100).toFixed(1) : "0.0";

  return [
    "以下は案件内の直近投稿実績です。投稿間で比較し、改善方針を出してください。",
    "",
    "【集計】",
    `分析投稿数: ${metrics.length}`,
    `合計リーチ: ${totals.reach}`,
    `合計表示回数: ${totals.impressions}`,
    `合計反応数: ${totals.engagement}`,
    `合計保存数: ${totals.saves}`,
    `合計Webクリック: ${totals.websiteClicks}`,
    `合計問い合わせ: ${totals.inquiries}`,
    `合計予約: ${totals.reservations}`,
    `合計売上金額: ${totals.salesAmount}`,
    `平均反応率: ${engagementRate}%`,
    `平均保存率: ${saveRate}%`,
    `平均クリック率: ${clickRate}%`,
    "",
    "【投稿別実績】",
    ...metrics.map((metric, index) => {
      const engagement = metric.likes + metric.comments + metric.saves + metric.shares;
      const rowEngagementRate = metric.reach > 0 ? ((engagement / metric.reach) * 100).toFixed(1) : "0.0";
      const rowSaveRate = metric.reach > 0 ? ((metric.saves / metric.reach) * 100).toFixed(1) : "0.0";

      return [
        `--- 投稿${index + 1} ---`,
        `タイトル: ${metric.content_posts?.title ?? "未設定"}`,
        `形式: ${metric.content_posts?.content_type ?? "未設定"}`,
        `状態: ${metric.content_posts?.status ?? "未設定"}`,
        `計測日時: ${metric.measured_at}`,
        `本文: ${metric.content_posts?.caption ?? "未設定"}`,
        `CTA: ${metric.content_posts?.cta ?? "未設定"}`,
        `ハッシュタグ: ${(metric.content_posts?.hashtags ?? []).join(" ") || "未設定"}`,
        `リーチ: ${metric.reach}`,
        `表示回数: ${metric.impressions}`,
        `いいね: ${metric.likes}`,
        `コメント: ${metric.comments}`,
        `保存: ${metric.saves}`,
        `シェア: ${metric.shares}`,
        `動画再生: ${metric.video_views}`,
        `プロフィールアクセス: ${metric.profile_accesses}`,
        `Webクリック: ${metric.website_clicks}`,
        `LINE追加: ${metric.line_adds}`,
        `問い合わせ: ${metric.inquiries}`,
        `予約: ${metric.reservations}`,
        `購入: ${metric.purchases}`,
        `売上金額: ${metric.sales_amount}`,
        `反応率: ${rowEngagementRate}%`,
        `保存率: ${rowSaveRate}%`,
        `運用メモ: ${metric.notes ?? "なし"}`
      ].join("\n");
    })
  ].join("\n");
}
