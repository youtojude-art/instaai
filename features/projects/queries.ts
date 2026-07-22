import { createClient } from "@/lib/supabase/server";

export type DashboardProject = {
  id: string;
  name: string;
  company_name: string | null;
  shop_name?: string | null;
  industry: string | null;
  status: "active" | "archived";
};

export type ProjectWorkspace = {
  project: {
    id: string;
    name: string;
    company_name: string | null;
    shop_name: string | null;
    industry: string | null;
    status: "active" | "archived";
  } | null;
  brandProfile: {
    concept: string | null;
    tone: string | null;
    speaking_rules: string | null;
    required_appeals: string | null;
    prohibited_words: string | null;
    legal_notes: string | null;
    colors: string | null;
    fonts: string | null;
  } | null;
  targetProfile: {
    name: string;
    age_range: string | null;
    gender: string | null;
    area: string | null;
    occupation: string | null;
    lifestyle: string | null;
    pains: string | null;
    desires: string | null;
    behavior_notes: string | null;
  } | null;
  aiEmployee: {
    name: string;
    personality: string | null;
    speaking_style: string | null;
    task_scope: string[];
    settings: {
      writingAmount?: "short" | "medium" | "long";
      emojiAmount?: "none" | "low" | "medium" | "high";
      salesTone?: "low" | "medium" | "high";
      proactiveSuggestions?: boolean;
    } | null;
  } | null;
};

export async function getDashboardProjects(): Promise<DashboardProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,company_name,industry,status")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as DashboardProject[];
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspace> {
  const supabase = await createClient();
  const [projectResult, brandResult, targetResult, aiEmployeeResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,company_name,shop_name,industry,status")
      .eq("id", projectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("brand_profiles")
      .select("concept,tone,speaking_rules,required_appeals,prohibited_words,legal_notes,colors,fonts")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("target_profiles")
      .select("name,age_range,gender,area,occupation,lifestyle,pains,desires,behavior_notes")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("ai_employees")
      .select("name,personality,speaking_style,task_scope,settings")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .maybeSingle()
  ]);

  return {
    project: projectResult.data as ProjectWorkspace["project"],
    brandProfile: brandResult.data as ProjectWorkspace["brandProfile"],
    targetProfile: targetResult.data as ProjectWorkspace["targetProfile"],
    aiEmployee: aiEmployeeResult.data as ProjectWorkspace["aiEmployee"]
  };
}
