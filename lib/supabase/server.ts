import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseBrowserEnv } from "@/lib/env/supabase";

export async function createClient() {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error("Supabaseの接続情報が未設定です。.env.local を確認してください。");
  }

  const cookieStore = await cookies();
  type CookieOptions = Parameters<typeof cookieStore.set>[2];
  type CookieToSet = {
    name: string;
    value: string;
    options?: CookieOptions;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; middleware/actions handle refresh writes.
          }
        }
      }
    }
  );
}
