"use server";

import { getProjectWorkspace } from "@/features/projects/queries";
import { generateAiImage } from "@/lib/ai/images";
import { createClient } from "@/lib/supabase/server";
import { generatePostImageSchema } from "@/lib/validations/post";

type ImageActionResult =
  | {
      ok: true;
      message: string;
      imageDataUrl: string;
      prompt: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function generatePostImage(formData: FormData): Promise<ImageActionResult> {
  const parsed = generatePostImageSchema.safeParse({
    postId: formData.get("postId"),
    format: formData.get("format"),
    extraPrompt: formData.get("extraPrompt")
  });

  if (!parsed.success) {
    return { ok: false, message: "画像生成の入力内容を確認してください。" };
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
    .select("id,project_id,title,content_type,caption,cta,hashtags")
    .eq("id", parsed.data.postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !post) {
    return { ok: false, message: `投稿を取得できませんでした: ${error?.message ?? "not found"}` };
  }

  const workspace = await getProjectWorkspace(post.project_id);
  const prompt = createPostImagePrompt({
    post,
    workspace,
    format: parsed.data.format,
    extraPrompt: parsed.data.extraPrompt ?? ""
  });
  const imageResult = await generateAiImage({
    prompt,
    size: parsed.data.format === "feed" ? "1024x1024" : "1024x1536"
  });

  if (!imageResult.ok) {
    return { ok: false, message: `画像生成に失敗しました: ${imageResult.message}` };
  }

  return {
    ok: true,
    message: "投稿イメージを生成しました。",
    imageDataUrl: imageResult.imageDataUrl,
    prompt
  };
}

function createPostImagePrompt({
  post,
  workspace,
  format,
  extraPrompt
}: {
  post: {
    title: string;
    content_type: string;
    caption: string | null;
    cta: string | null;
    hashtags: string[] | null;
  };
  workspace: Awaited<ReturnType<typeof getProjectWorkspace>>;
  format: "feed" | "story";
  extraPrompt: string;
}) {
  const formatInstruction =
    format === "feed"
      ? [
          "Instagram feed creative, square 1:1 composition.",
          "Design for a premium Japanese business account feed post.",
          "Use a clear center subject, strong negative space, refined lighting, and a scroll-stopping composition."
        ].join(" ")
      : [
          "Instagram story creative, vertical 9:16 composition.",
          "Design for a premium Japanese business account story.",
          "Use a strong top-to-bottom visual hierarchy and leave safe margins at top and bottom for Instagram UI overlays."
        ].join(" ");

  return [
    formatInstruction,
    "Create one finished, high-end social media visual, not a rough concept and not a mockup.",
    "Use commercial photography or premium editorial advertising art direction: crisp focus, natural depth, tasteful color grading, professional composition, realistic materials, and clean lighting.",
    "Avoid generic stock-photo feeling, cluttered layouts, random decorative shapes, low-resolution details, distorted objects, fake UI, and unreadable text.",
    "Do not include logos of real brands unless explicitly provided.",
    "Prefer no embedded text. If text is necessary, use only a very short Japanese headline with large clean typography and no small text.",
    "The result should feel ready to post on Instagram after only minor human review.",
    "",
    "Business context:",
    `Project: ${workspace.project?.name ?? "未設定"}`,
    `Company: ${workspace.project?.company_name ?? "未設定"}`,
    `Industry: ${workspace.project?.industry ?? "未設定"}`,
    `Location: ${workspace.project?.shop_name ?? workspace.project?.company_name ?? "未設定"}`,
    "",
    "Brand guidance:",
    `Concept: ${workspace.brandProfile?.concept ?? "未設定"}`,
    `Tone: ${workspace.brandProfile?.tone ?? "未設定"}`,
    `Required appeals: ${workspace.brandProfile?.required_appeals ?? "未設定"}`,
    `Prohibited words or expressions: ${workspace.brandProfile?.prohibited_words ?? "未設定"}`,
    `Colors: ${workspace.brandProfile?.colors ?? "未設定"}`,
    "",
    "Target audience:",
    `Name: ${workspace.targetProfile?.name ?? "未設定"}`,
    `Age: ${workspace.targetProfile?.age_range ?? "未設定"}`,
    `Lifestyle: ${workspace.targetProfile?.lifestyle ?? "未設定"}`,
    `Pain points: ${workspace.targetProfile?.pains ?? "未設定"}`,
    `Desires: ${workspace.targetProfile?.desires ?? "未設定"}`,
    "",
    "Post content:",
    `Title: ${post.title}`,
    `Content type: ${post.content_type}`,
    `Caption: ${post.caption ?? "未設定"}`,
    `CTA: ${post.cta ?? "未設定"}`,
    `Hashtags: ${(post.hashtags ?? []).join(" ") || "未設定"}`,
    "",
    extraPrompt ? `Additional direction from operator: ${extraPrompt}` : "",
    "Final quality requirements: premium, polished, realistic, commercially usable, visually coherent, no collage grid, no before/after comparison, no screenshot frame, no placeholder text."
  ]
    .filter(Boolean)
    .join("\n");
}
