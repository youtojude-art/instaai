import { createClient } from "@/lib/supabase/server";

export type ProjectRole = "owner" | "operator" | "approver" | "viewer";

export async function hasProjectRole(projectId: string, allowedRoles: ProjectRole[]) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: globalRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (globalRoles?.some((item) => item.role === "admin")) {
    return true;
  }

  const { data } = await supabase
    .from("project_members")
    .select("project_role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? allowedRoles.includes(data.project_role as ProjectRole) : false;
}
