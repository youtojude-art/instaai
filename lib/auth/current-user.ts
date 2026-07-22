import { createClient } from "@/lib/supabase/server";

export type CurrentUserProfile = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("users").select("id,email,name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id)
  ]);

  return {
    id: user.id,
    email: profile?.email ?? user.email,
    name: profile?.name ?? user.email,
    roles: roles?.map((row) => row.role) ?? []
  };
}
