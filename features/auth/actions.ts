"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export async function signInWithPassword(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "メールアドレスとパスワードを確認してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: getLoginErrorMessage(error) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function getLoginErrorMessage(error: AuthError) {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが違います。SupabaseのAuthentication > Usersで作成したユーザー情報を確認してください。";
  }

  if (message.includes("email not confirmed")) {
    return "メール確認が完了していません。SupabaseのAuthentication > UsersでAuto Confirm済みのユーザーにしてください。";
  }

  if (message.includes("invalid api key") || message.includes("api key")) {
    return "SupabaseのURLと公開キーが一致していない可能性があります。Project Settings > APIの値を確認してください。";
  }

  if (message.includes("fetch failed") || message.includes("network")) {
    return "Supabaseへ接続できませんでした。Project URLとネットワーク接続を確認してください。";
  }

  return `ログインに失敗しました。Supabaseからの理由: ${error.message}`;
}
