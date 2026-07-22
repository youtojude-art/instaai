import { createClient } from "@/lib/supabase/server";
import type { ProjectWorkspace } from "@/features/projects/queries";

export type ChatProject = {
  id: string;
  name: string;
  company_name: string | null;
  industry: string | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type ChatThread = {
  id: string;
  title: string;
};

export async function getChatProjects(): Promise<ChatProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,company_name,industry")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as ChatProject[];
}

export async function getChatWorkspace(projectId?: string) {
  const projects = await getChatProjects();
  const selectedProjectId = projectId && projects.some((project) => project.id === projectId) ? projectId : projects[0]?.id;

  if (!selectedProjectId) {
    return {
      projects,
      selectedProjectId: null,
      workspace: null,
      thread: null,
      messages: []
    };
  }

  const supabase = await createClient();
  const [projectResult, brandResult, targetResult, aiEmployeeResult, threadResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,company_name,shop_name,industry,status")
      .eq("id", selectedProjectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("brand_profiles")
      .select("concept,tone,speaking_rules,required_appeals,prohibited_words,legal_notes,colors,fonts")
      .eq("project_id", selectedProjectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("target_profiles")
      .select("name,age_range,gender,area,occupation,lifestyle,pains,desires,behavior_notes")
      .eq("project_id", selectedProjectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("ai_employees")
      .select("id,name,personality,speaking_style,task_scope,settings")
      .eq("project_id", selectedProjectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("chat_threads")
      .select("id,title")
      .eq("project_id", selectedProjectId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const thread = threadResult.data as ChatThread | null;
  const messages = thread
    ? await getChatMessages(thread.id)
    : [];

  return {
    projects,
    selectedProjectId,
    workspace: {
      project: projectResult.data,
      brandProfile: brandResult.data,
      targetProfile: targetResult.data,
      aiEmployee: aiEmployeeResult.data
    } as ProjectWorkspace & { aiEmployee: (ProjectWorkspace["aiEmployee"] & { id?: string }) | null },
    thread,
    messages
  };
}

async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id,role,content,created_at")
    .eq("thread_id", threadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data as ChatMessage[];
}
