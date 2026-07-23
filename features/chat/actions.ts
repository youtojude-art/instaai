"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProjectWorkspace } from "@/features/projects/queries";
import { generateAiReply } from "@/lib/ai/openai";
import { sendChatMessageSchema } from "@/lib/validations/chat";

type ActionResult = {
  ok: boolean;
  message: string;
};

type ChatImageAttachment = {
  type: "image";
  dataUrl: string;
  mimeType: string;
  name: string | null;
  size: number | null;
};

export async function sendChatMessage(formData: FormData): Promise<ActionResult> {
  const parsed = sendChatMessageSchema.safeParse({
    projectId: formData.get("projectId"),
    content: formData.get("content"),
    imageDataUrl: formData.get("imageDataUrl"),
    imageMimeType: formData.get("imageMimeType"),
    imageName: formData.get("imageName"),
    imageSize: formData.get("imageSize")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "メッセージを入力してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const workspace = await getProjectWorkspace(parsed.data.projectId);
  if (!workspace.project) {
    return { ok: false, message: "案件が見つかりません。" };
  }

  const thread = await getOrCreateThread(parsed.data.projectId, user.id, workspace.aiEmployee?.name ?? null);
  if (!thread.ok) {
    return { ok: false, message: thread.message };
  }

  const imageAttachment = createImageAttachment(parsed.data);
  const userMessageContent = parsed.data.content || "画像を添付しました。";

  const { error: userMessageError } = await supabase.from("chat_messages").insert({
    thread_id: thread.threadId,
    project_id: parsed.data.projectId,
    role: "user",
    content: userMessageContent,
    metadata: {
      attachments: imageAttachment ? [imageAttachment] : []
    },
    created_by: user.id
  });

  if (userMessageError) {
    return { ok: false, message: `メッセージを保存できませんでした: ${userMessageError.message}` };
  }

  const assistantReplyResult = await createAssistantReply(userMessageContent, workspace, imageAttachment?.dataUrl);
  const { error: assistantMessageError } = await supabase.from("chat_messages").insert({
    thread_id: thread.threadId,
    project_id: parsed.data.projectId,
    role: "assistant",
    content: assistantReplyResult.text,
    metadata: {
      source: assistantReplyResult.ok ? "openai" : "fallback",
      error: assistantReplyResult.ok ? null : assistantReplyResult.error
    },
    created_by: user.id
  });

  if (assistantMessageError) {
    return { ok: false, message: `AI社員の返信を保存できませんでした: ${assistantMessageError.message}` };
  }

  await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", thread.threadId);

  revalidatePath(`/ai-chat`);
  return { ok: true, message: "送信しました。" };
}

async function getOrCreateThread(projectId: string, userId: string, aiEmployeeName: string | null) {
  const supabase = await createClient();
  const { data: existingThread, error: existingError } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { ok: false as const, message: `チャット履歴を取得できませんでした: ${existingError.message}` };
  }

  if (existingThread?.id) {
    return { ok: true as const, threadId: existingThread.id as string };
  }

  const { data: createdThread, error: createError } = await supabase
    .from("chat_threads")
    .insert({
      project_id: projectId,
      title: aiEmployeeName ? `${aiEmployeeName}とのチャット` : "AI社員チャット",
      created_by: userId
    })
    .select("id")
    .single();

  if (createError || !createdThread?.id) {
    return { ok: false as const, message: `チャットを開始できませんでした: ${createError?.message ?? "unknown error"}` };
  }

  return { ok: true as const, threadId: createdThread.id as string };
}

function createImageAttachment(data: {
  imageDataUrl?: string;
  imageMimeType?: string;
  imageName?: string;
  imageSize?: number;
}): ChatImageAttachment | null {
  if (!data.imageDataUrl || !data.imageMimeType) {
    return null;
  }

  return {
    type: "image",
    dataUrl: data.imageDataUrl,
    mimeType: data.imageMimeType,
    name: data.imageName ?? null,
    size: data.imageSize ?? null
  };
}

async function createAssistantReply(
  userInstruction: string,
  workspace: Awaited<ReturnType<typeof getProjectWorkspace>>,
  imageDataUrl?: string
) {
  const aiReply = await generateAiReply({
    systemPrompt: createSystemPrompt(workspace),
    userPrompt: imageDataUrl
      ? [
          userInstruction,
          "",
          "添付画像を確認し、Instagram運用に使える観点で分析してください。",
          "必要に応じて、画像内容、投稿文、改善点、確認事項、次に行うタスクを整理してください。"
        ].join("\n")
      : userInstruction,
    imageDataUrl
  });

  if (aiReply.ok) {
    return {
      ok: true as const,
      text: aiReply.text
    };
  }

  return {
    ok: false as const,
    error: aiReply.message,
    text: createFallbackReply(userInstruction, workspace, aiReply.message, Boolean(imageDataUrl))
  };
}

function createSystemPrompt(workspace: Awaited<ReturnType<typeof getProjectWorkspace>>) {
  const aiName = workspace.aiEmployee?.name ?? "AI社員";
  const projectName = workspace.project?.name ?? "選択中の案件";
  const companyName = workspace.project?.company_name ?? "未設定";
  const industry = workspace.project?.industry ?? "未設定";
  const aiPersonality = workspace.aiEmployee?.personality ?? "丁寧で実務的";
  const aiSpeakingStyle = workspace.aiEmployee?.speaking_style ?? "事務スタッフに分かりやすく、結論から簡潔に話す";
  const taskScope = workspace.aiEmployee?.task_scope?.join("、") ?? "Instagram運用全般";

  return [
    "あなたは、自社のInstagram運用を担当するAI社員です。",
    "単なる文章生成AIではなく、事務スタッフから業務指示を受け、企画、制作、確認、進行管理、分析、改善まで支援してください。",
    "外部SaaSの販売担当ではなく、社内業務を助ける実務担当者として振る舞ってください。",
    "",
    "【AI社員設定】",
    `AI社員名: ${aiName}`,
    `性格: ${aiPersonality}`,
    `話し方: ${aiSpeakingStyle}`,
    `担当業務: ${taskScope}`,
    "",
    "【案件情報】",
    `案件名: ${projectName}`,
    `会社名: ${companyName}`,
    `業種: ${industry}`,
    "",
    "【ブランド情報】",
    `ブランドコンセプト: ${workspace.brandProfile?.concept ?? "未設定"}`,
    `ブランドトーン: ${workspace.brandProfile?.tone ?? "未設定"}`,
    `話し方ルール: ${workspace.brandProfile?.speaking_rules ?? "未設定"}`,
    `必須訴求: ${workspace.brandProfile?.required_appeals ?? "未設定"}`,
    `使用禁止表現: ${workspace.brandProfile?.prohibited_words ?? "未設定"}`,
    `法務・広告表現の注意: ${workspace.brandProfile?.legal_notes ?? "未設定"}`,
    "",
    "【ターゲット情報】",
    `ターゲット名: ${workspace.targetProfile?.name ?? "未設定"}`,
    `年齢: ${workspace.targetProfile?.age_range ?? "未設定"}`,
    `性別: ${workspace.targetProfile?.gender ?? "未設定"}`,
    `地域: ${workspace.targetProfile?.area ?? "未設定"}`,
    `職業: ${workspace.targetProfile?.occupation ?? "未設定"}`,
    `ライフスタイル: ${workspace.targetProfile?.lifestyle ?? "未設定"}`,
    `悩み: ${workspace.targetProfile?.pains ?? "未設定"}`,
    `欲求: ${workspace.targetProfile?.desires ?? "未設定"}`,
    `行動してほしい内容: ${workspace.targetProfile?.behavior_notes ?? "未設定"}`,
    "",
    "【回答ルール】",
    "1. 事務スタッフの指示を最優先する",
    "2. 指示が曖昧な場合は、登録情報をもとに最適案を出す",
    "3. 不足情報があれば、作業を止めずに不足項目として整理する",
    "4. ブランドトーン、必須訴求、NG表現を必ず反映する",
    "5. 根拠のない断定や誇張表現は避ける",
    "6. 回答は日本語で、事務スタッフがそのまま作業に使える形にする",
    "7. 必要に応じて、作成内容、必要素材、確認事項、次に行うタスクを整理する"
  ].join("\n");
}

function createFallbackReply(
  userInstruction: string,
  workspace: Awaited<ReturnType<typeof getProjectWorkspace>>,
  errorMessage: string,
  hasImage = false
) {
  const aiName = workspace.aiEmployee?.name ?? "AI社員";
  const projectName = workspace.project?.name ?? "選択中の案件";
  const tone = workspace.brandProfile?.tone ?? "未設定";
  const target = workspace.targetProfile?.name ?? "未設定";
  const requiredAppeals = workspace.brandProfile?.required_appeals ?? "未設定";
  const prohibitedWords = workspace.brandProfile?.prohibited_words ?? "未設定";

  return [
    `${aiName}です。${projectName}の内容として受け取りました。`,
    "",
    `指示内容: ${userInstruction}`,
    hasImage ? "添付画像: あり" : "添付画像: なし",
    "",
    "参照した案件情報:",
    `- ブランドトーン: ${tone}`,
    `- ターゲット: ${target}`,
    `- 必須訴求: ${requiredAppeals}`,
    `- NG表現: ${prohibitedWords}`,
    "",
    "OpenAI APIでの生成に失敗したため、まずは案件情報の確認として返信しています。",
    `エラー: ${errorMessage}`
  ].join("\n");
}
