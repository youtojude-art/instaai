"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createProjectSchema } from "@/lib/validations/project";

export async function createProject(formData: FormData) {
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    shopName: formData.get("shopName"),
    industry: formData.get("industry")
  });

  if (!parsed.success) {
    return { ok: false, message: "入力内容を確認してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "ログインが必要です。" };
  }

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const isAdmin = roles?.some((item) => item.role === "admin") ?? false;

  if (!isAdmin) {
    return {
      ok: false,
      message:
        "案件登録にはadmin権限が必要です。SupabaseのSQL Editorで、このユーザーにadmin権限を付与してください。"
    };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: parsed.data.name,
      company_name: parsed.data.companyName || null,
      shop_name: parsed.data.shopName || null,
      industry: parsed.data.industry || null
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: `案件を登録できませんでした: ${error.message}` };
  }

  if (project) {
    await supabase.from("project_members").upsert({
      project_id: project.id,
      user_id: user.id,
      project_role: "owner"
    });
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { ok: true, message: "案件を登録しました。" };
}
