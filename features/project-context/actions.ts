"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aiEmployeeSchema, brandProfileSchema, targetProfileSchema } from "@/lib/validations/project-context";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function upsertBrandProfile(formData: FormData): Promise<ActionResult> {
  const parsed = brandProfileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "ブランド情報の入力内容を確認してください。" };
  }

  const supabase = await createClient();
  const { projectId, speakingRules, requiredAppeals, prohibitedWords, legalNotes, ...rest } = parsed.data;
  const { error } = await supabase.from("brand_profiles").upsert(
    {
      project_id: projectId,
      concept: rest.concept || null,
      tone: rest.tone || null,
      speaking_rules: speakingRules || null,
      required_appeals: requiredAppeals || null,
      prohibited_words: prohibitedWords || null,
      legal_notes: legalNotes || null,
      colors: rest.colors || null,
      fonts: rest.fonts || null
    },
    { onConflict: "project_id" }
  );

  if (error) {
    return { ok: false, message: `ブランド情報を保存できませんでした: ${error.message}` };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "ブランド情報を保存しました。" };
}

export async function upsertTargetProfile(formData: FormData): Promise<ActionResult> {
  const parsed = targetProfileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "ターゲット情報の入力内容を確認してください。" };
  }

  const supabase = await createClient();
  const { projectId, ageRange, behaviorNotes, ...rest } = parsed.data;
  const { error } = await supabase.from("target_profiles").upsert(
    {
      project_id: projectId,
      name: rest.name,
      age_range: ageRange || null,
      gender: rest.gender || null,
      area: rest.area || null,
      occupation: rest.occupation || null,
      lifestyle: rest.lifestyle || null,
      pains: rest.pains || null,
      desires: rest.desires || null,
      behavior_notes: behaviorNotes || null
    },
    { onConflict: "project_id" }
  );

  if (error) {
    return { ok: false, message: `ターゲット情報を保存できませんでした: ${error.message}` };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "ターゲット情報を保存しました。" };
}

export async function upsertAiEmployee(formData: FormData): Promise<ActionResult> {
  const parsed = aiEmployeeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "AI社員設定の入力内容を確認してください。" };
  }

  const supabase = await createClient();
  const { projectId, taskScope, writingAmount, emojiAmount, salesTone, proactiveSuggestions, ...rest } = parsed.data;
  const taskScopeItems = taskScope
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase.from("ai_employees").upsert(
    {
      project_id: projectId,
      name: rest.name,
      personality: rest.personality || null,
      speaking_style: rest.speakingStyle || null,
      task_scope: taskScopeItems.length > 0 ? taskScopeItems : undefined,
      settings: {
        writingAmount,
        emojiAmount,
        salesTone,
        proactiveSuggestions: proactiveSuggestions === "true"
      }
    },
    { onConflict: "project_id" }
  );

  if (error) {
    return { ok: false, message: `AI社員設定を保存できませんでした: ${error.message}` };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "AI社員設定を保存しました。" };
}
