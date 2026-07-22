"use server";

import { revalidatePath } from "next/cache";
import { createPostTitleFromContent } from "@/features/posts/title";
import { createClient } from "@/lib/supabase/server";
import {
  saveChatMessageAsPostSchema,
  submitPostApprovalSchema,
  updatePostContentSchema,
  updatePostStatusSchema
} from "@/lib/validations/post";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function saveChatMessageAsPost(formData: FormData): Promise<ActionResult> {
  const parsed = saveChatMessageAsPostSchema.safeParse({
    messageId: formData.get("messageId")
  });

  if (!parsed.success) {
    return { ok: false, message: "保存対象のメッセージが不正です。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .select("id,project_id,role,content")
    .eq("id", parsed.data.messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (messageError || !message) {
    return { ok: false, message: `メッセージを取得できませんでした: ${messageError?.message ?? "not found"}` };
  }

  if (message.role !== "assistant") {
    return { ok: false, message: "AI社員の返信だけ投稿案として保存できます。" };
  }

  const contentType = detectContentType(message.content);
  const title = createPostTitleFromContent(message.content, contentType);
  const hashtags = extractHashtags(message.content);
  const cta = extractCta(message.content);

  const { data: post, error: postError } = await supabase
    .from("content_posts")
    .insert({
      project_id: message.project_id,
      source_chat_message_id: message.id,
      title,
      content_type: contentType,
      status: "idea",
      priority: "medium",
      caption: message.content,
      cta,
      hashtags,
      ai_payload: {
        source: "chat_message",
        sourceChatMessageId: message.id
      },
      created_by: user.id
    })
    .select("id")
    .single();

  if (postError || !post) {
    return { ok: false, message: `投稿案を保存できませんでした: ${postError?.message ?? "unknown error"}` };
  }

  await supabase.from("content_versions").insert({
    post_id: post.id,
    project_id: message.project_id,
    version_number: 1,
    title,
    caption: message.content,
    cta,
    hashtags,
    change_note: "AIチャットから投稿案として保存",
    created_by: user.id
  });

  revalidatePath("/ai-chat");
  revalidatePath("/posts");
  return { ok: true, message: "投稿案として保存しました。" };
}

export async function updatePostStatus(formData: FormData): Promise<ActionResult> {
  const parsed = updatePostStatusSchema.safeParse({
    postId: formData.get("postId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { ok: false, message: "ステータスを更新できませんでした。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("content_posts").update({ status: parsed.data.status }).eq("id", parsed.data.postId);

  if (error) {
    return { ok: false, message: `ステータスを更新できませんでした: ${error.message}` };
  }

  revalidatePath("/posts");
  revalidatePath("/approvals");
  revalidatePath("/calendar");
  revalidatePath(`/posts/${parsed.data.postId}`);
  return { ok: true, message: "ステータスを更新しました。" };
}

export async function submitPostApproval(formData: FormData): Promise<ActionResult> {
  const parsed = submitPostApprovalSchema.safeParse({
    postId: formData.get("postId"),
    action: formData.get("action"),
    note: formData.get("note")
  });

  if (!parsed.success) {
    return { ok: false, message: "承認操作の内容を確認してください。" };
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
    .select("id,project_id,status")
    .eq("id", parsed.data.postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (postError || !post) {
    return { ok: false, message: `投稿を取得できませんでした: ${postError?.message ?? "not found"}` };
  }

  const toStatus = getApprovalTargetStatus(parsed.data.action);
  const { error: updateError } = await supabase
    .from("content_posts")
    .update({ status: toStatus })
    .eq("id", parsed.data.postId);

  if (updateError) {
    return { ok: false, message: `承認ステータスを更新できませんでした: ${updateError.message}` };
  }

  const { error: approvalError } = await supabase.from("content_approvals").insert({
    project_id: post.project_id,
    post_id: post.id,
    action: parsed.data.action,
    from_status: post.status,
    to_status: toStatus,
    note: parsed.data.note || null,
    action_by: user.id
  });

  if (approvalError) {
    return { ok: false, message: `承認履歴を保存できませんでした: ${approvalError.message}` };
  }

  revalidatePath("/posts");
  revalidatePath("/approvals");
  revalidatePath("/calendar");
  revalidatePath(`/posts/${parsed.data.postId}`);
  return { ok: true, message: getApprovalResultMessage(parsed.data.action) };
}

export async function updatePostContent(formData: FormData): Promise<ActionResult> {
  const parsed = updatePostContentSchema.safeParse({
    postId: formData.get("postId"),
    title: formData.get("title"),
    caption: formData.get("caption"),
    cta: formData.get("cta"),
    hashtags: formData.get("hashtags"),
    scheduledAt: formData.get("scheduledAt")
  });

  if (!parsed.success) {
    return { ok: false, message: "投稿内容の入力を確認してください。" };
  }

  const supabase = await createClient();
  const hashtags = parseHashtags(parsed.data.hashtags ?? "");
  const scheduledAt = parseScheduledAt(parsed.data.scheduledAt);
  const updatePayload = {
    title: parsed.data.title,
    caption: parsed.data.caption || null,
    cta: parsed.data.cta || null,
    hashtags,
    scheduled_at: scheduledAt,
    ...(scheduledAt ? { status: "scheduled" } : {})
  };
  const { data: post, error: currentError } = await supabase
    .from("content_posts")
    .select("id,project_id")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (currentError || !post) {
    return { ok: false, message: `投稿を取得できませんでした: ${currentError?.message ?? "not found"}` };
  }

  const { error } = await supabase
    .from("content_posts")
    .update(updatePayload)
    .eq("id", parsed.data.postId);

  if (error) {
    return { ok: false, message: `投稿内容を保存できませんでした: ${error.message}` };
  }

  const { data: versions } = await supabase
    .from("content_versions")
    .select("version_number")
    .eq("post_id", parsed.data.postId)
    .order("version_number", { ascending: false })
    .limit(1);
  const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await supabase.from("content_versions").insert({
    post_id: parsed.data.postId,
    project_id: post.project_id,
    version_number: nextVersion,
    title: parsed.data.title,
    caption: parsed.data.caption || null,
    cta: parsed.data.cta || null,
    hashtags,
    change_note: "投稿詳細画面で編集",
    created_by: user?.id ?? null
  });

  revalidatePath("/posts");
  revalidatePath("/calendar");
  revalidatePath(`/posts/${parsed.data.postId}`);
  return { ok: true, message: "投稿内容を保存しました。" };
}

function extractHashtags(content: string) {
  const tags = content.match(/#[\p{Letter}\p{Number}_ぁ-んァ-ヶ一-龠ー]+/gu) ?? [];
  return Array.from(new Set(tags)).slice(0, 30);
}

function parseHashtags(value: string) {
  return value
    .split(/[\s,、]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 30);
}

function extractCta(content: string) {
  const ctaLine = content
    .split(/\r?\n/)
    .find((line) => /cta|行動|予約|問い合わせ|来店|line/i.test(line));
  return ctaLine?.replace(/^[-・\s]*/, "").slice(0, 300) ?? null;
}

function detectContentType(content: string) {
  if (/リール|動画|台本/.test(content)) return "reel";
  if (/ストーリーズ|story/i.test(content)) return "story";
  if (/カルーセル|フィード|スライド/.test(content)) return "carousel";
  return "other";
}

function parseScheduledAt(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function getApprovalTargetStatus(action: "requested" | "approved" | "rejected" | "cancelled") {
  if (action === "requested") return "approval_waiting";
  if (action === "approved") return "approved";
  if (action === "rejected") return "rejected";
  return "planning";
}

function getApprovalResultMessage(action: "requested" | "approved" | "rejected" | "cancelled") {
  if (action === "requested") return "承認依頼を出しました。";
  if (action === "approved") return "投稿を承認しました。";
  if (action === "rejected") return "投稿を差し戻しました。";
  return "承認依頼を取り下げました。";
}
