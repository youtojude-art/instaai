import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseBrowserEnv } from "@/lib/env/supabase";

export async function middleware(request: NextRequest) {
  if (!hasSupabaseBrowserEnv()) {
    if (request.nextUrl.pathname === "/setup") {
      return NextResponse.next({ request });
    }

    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = "/setup";
    return NextResponse.redirect(setupUrl);
  }

  let response = NextResponse.next({
    request
  });
  type CookieOptions = Parameters<typeof response.cookies.set>[2];
  type CookieToSet = {
    name: string;
    value: string;
    options?: CookieOptions;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
