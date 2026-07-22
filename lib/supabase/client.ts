import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseBrowserEnv } from "@/lib/env/supabase";

export function createClient() {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error("Supabaseの接続情報が未設定です。.env.local を確認してください。");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
