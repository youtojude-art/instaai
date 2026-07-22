"use server";

import { revalidatePath } from "next/cache";
import { getProjectWorkspace } from "@/features/projects/queries";
import { generateAiReply } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";
import {
  createExtractedTasksSchema,
  createTaskSchema,
  extractPostTasksSchema,
  updateTaskStatusSchema
} from "@/lib/validations/task";

type ActionResult = {
  ok: boolean;
  message: string;
};

type ExtractTasksResult =
  | {
      ok: true;
      message: string;
      tasks: ExtractedTask[];
      source: "openai" | "fallback";
    }
  | {
      ok: false;
      message: string;
    };

type ExtractedTask = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
};

export async function createContentTask(formData: FormData): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse({
    projectId: formData.get("projectId"),
    postId: formData.get("postId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt")
  });

  if (!parsed.success) {
    return { ok: false, message: "タスク内容を確認してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const dueAt = parseDueAt(parsed.data.dueAt);
  const { error } = await supabase.from("content_tasks").insert({
    project_id: parsed.data.projectId,
    post_id: parsed.data.postId || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    due_at: dueAt,
    status: "todo",
    created_by: user.id
  });

  if (error) {
    return { ok: false, message: `タスクを作成できませんでした: ${error.message}` };
  }

  revalidatePath("/tasks");
  revalidatePath("/posts");
  if (parsed.data.postId) {
    revalidatePath(`/posts/${parsed.data.postId}`);
  }
  return { ok: true, message: "タスクを作成しました。" };
}

export async function updateContentTaskStatus(formData: FormData): Promise<ActionResult> {
  const parsed = updateTaskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { ok: false, message: "タスク状態を更新できませんでした。" };
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("content_tasks")
    .select("id,post_id")
    .eq("id", parsed.data.taskId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError || !task) {
    return { ok: false, message: `タスクを取得できませんでした: ${taskError?.message ?? "not found"}` };
  }

  const { error } = await supabase
    .from("content_tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.taskId);

  if (error) {
    return { ok: false, message: `タスク状態を更新できませんでした: ${error.message}` };
  }

  revalidatePath("/tasks");
  if (task.post_id) {
    revalidatePath(`/posts/${task.post_id}`);
  }
  return { ok: true, message: "タスク状態を更新しました。" };
}

export async function extractPostTasks(formData: FormData): Promise<ExtractTasksResult> {
  const parsed = extractPostTasksSchema.safeParse({
    postId: formData.get("postId")
  });

  if (!parsed.success) {
    return { ok: false, message: "タスク抽出対象の投稿が不正です。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const { data: post, error } = await supabase
    .from("content_posts")
    .select("id,project_id,title,content_type,status,scheduled_at,caption,cta,hashtags")
    .eq("id", parsed.data.postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !post) {
    return { ok: false, message: `投稿を取得できませんでした: ${error?.message ?? "not found"}` };
  }

  const workspace = await getProjectWorkspace(post.project_id);
  const aiResult = await generateAiReply({
    systemPrompt: createTaskExtractionSystemPrompt(),
    userPrompt: createTaskExtractionUserPrompt({ post, workspace })
  });

  if (!aiResult.ok) {
    return {
      ok: true,
      message: `AI抽出に失敗したため、標準タスク候補を作成しました: ${aiResult.message}`,
      tasks: createFallbackTasks(post.status),
      source: "fallback"
    };
  }

  const extractedTasks = parseExtractedTasks(aiResult.text);

  return {
    ok: true,
    message: "タスク候補を抽出しました。",
    tasks: extractedTasks.length > 0 ? extractedTasks : createFallbackTasks(post.status),
    source: extractedTasks.length > 0 ? "openai" : "fallback"
  };
}

export async function createExtractedTasks(input: {
  postId: string;
  tasks: ExtractedTask[];
}): Promise<ActionResult> {
  const parsed = createExtractedTasksSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "作成するタスク候補を確認してください。" };
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

  const { error } = await supabase.from("content_tasks").insert(
    parsed.data.tasks.map((task) => ({
      project_id: post.project_id,
      post_id: post.id,
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      status: "todo",
      created_by: user.id
    }))
  );

  if (error) {
    return { ok: false, message: `抽出タスクを作成できませんでした: ${error.message}` };
  }

  revalidatePath("/tasks");
  revalidatePath(`/posts/${post.id}`);
  return { ok: true, message: `${parsed.data.tasks.length}件のタスクを作成しました。` };
}

function parseDueAt(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function createTaskExtractionSystemPrompt() {
  return [
    "あなたはInstagram運用の進行管理担当です。",
    "投稿内容から、事務スタッフが実行すべきタスク候補を抽出してください。",
    "素材準備、画像生成、本文確認、承認、投稿予約、公開後の実績入力など、実務で必要な作業に分解してください。",
    "出力はJSONのみ。説明文やMarkdownは出さないでください。",
    "",
    "JSON形式:",
    "{\"tasks\":[{\"title\":\"タスク名\",\"description\":\"作業内容\",\"priority\":\"medium\"}]}",
    "",
    "制約:",
    "- tasksは3件から7件",
    "- priorityはlow, medium, highのみ",
    "- titleは短く具体的に",
    "- descriptionは事務スタッフが迷わず作業できる内容にする"
  ].join("\n");
}

function createTaskExtractionUserPrompt({
  post,
  workspace
}: {
  post: {
    title: string;
    content_type: string;
    status: string;
    scheduled_at: string | null;
    caption: string | null;
    cta: string | null;
    hashtags: string[] | null;
  };
  workspace: Awaited<ReturnType<typeof getProjectWorkspace>>;
}) {
  return [
    "以下の投稿からタスク候補を抽出してください。",
    "",
    "【案件】",
    `案件名: ${workspace.project?.name ?? "未設定"}`,
    `会社名: ${workspace.project?.company_name ?? "未設定"}`,
    `業種: ${workspace.project?.industry ?? "未設定"}`,
    "",
    "【投稿】",
    `タイトル: ${post.title}`,
    `形式: ${post.content_type}`,
    `ステータス: ${post.status}`,
    `投稿予定日時: ${post.scheduled_at ?? "未設定"}`,
    `本文: ${post.caption ?? "未設定"}`,
    `CTA: ${post.cta ?? "未設定"}`,
    `ハッシュタグ: ${(post.hashtags ?? []).join(" ") || "未設定"}`,
    "",
    "【ブランド注意】",
    `必須訴求: ${workspace.brandProfile?.required_appeals ?? "未設定"}`,
    `禁止表現: ${workspace.brandProfile?.prohibited_words ?? "未設定"}`,
    `法務注意: ${workspace.brandProfile?.legal_notes ?? "未設定"}`
  ].join("\n");
}

function parseExtractedTasks(text: string): ExtractedTask[] {
  try {
    const jsonText = extractJsonObject(text);
    const parsed = JSON.parse(jsonText) as {
      tasks?: Array<{
        title?: unknown;
        description?: unknown;
        priority?: unknown;
      }>;
    };

    return (parsed.tasks ?? [])
      .map((task) => ({
        title: typeof task.title === "string" ? task.title.trim().slice(0, 160) : "",
        description: typeof task.description === "string" ? task.description.trim().slice(0, 1000) : "",
        priority: normalizePriority(task.priority)
      }))
      .filter((task) => task.title)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return text;
  }

  return text.slice(start, end + 1);
}

function normalizePriority(value: unknown): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function createFallbackTasks(status: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [
    {
      title: "投稿内容を確認する",
      description: "本文、CTA、ハッシュタグ、禁止表現の有無を確認する。",
      priority: "high"
    },
    {
      title: "投稿画像を準備する",
      description: "フィードまたはストーリー用の投稿イメージを生成し、必要に応じて人が調整する。",
      priority: "medium"
    },
    {
      title: "投稿予約を設定する",
      description: "投稿予定日時に合わせてInstagram側で予約または投稿準備を行う。",
      priority: "medium"
    },
    {
      title: "公開後の実績を入力する",
      description: "公開後にリーチ、いいね、保存、コメントなどの実績値を入力する。",
      priority: "low"
    }
  ];

  if (status === "approval_waiting" || status === "staff_review") {
    return [
      {
        title: "承認者に確認依頼する",
        description: "投稿内容と画像案を確認してもらい、必要な修正点を回収する。",
        priority: "high"
      },
      ...tasks
    ];
  }

  return tasks;
}
