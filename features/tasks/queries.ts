import { createClient } from "@/lib/supabase/server";

export type ContentTask = {
  id: string;
  project_id: string;
  post_id: string | null;
  title: string;
  status: "todo" | "doing" | "review_waiting" | "done" | "blocked";
  priority: "low" | "medium" | "high";
  due_at: string | null;
  description: string | null;
  created_at: string;
  projects: {
    name: string;
  } | null;
  content_posts: {
    title: string;
  } | null;
};

export type TaskPostOption = {
  id: string;
  project_id: string;
  title: string;
  projects: {
    name: string;
  } | null;
};

export async function getContentTasks(): Promise<ContentTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_tasks")
    .select("id,project_id,post_id,title,status,priority,due_at,description,created_at,projects(name),content_posts(title)")
    .is("deleted_at", null)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as ContentTask[];
}

export async function getPostTasks(postId: string): Promise<ContentTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_tasks")
    .select("id,project_id,post_id,title,status,priority,due_at,description,created_at,projects(name),content_posts(title)")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as ContentTask[];
}

export async function getTaskPostOptions(): Promise<TaskPostOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id,project_id,title,projects(name)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as TaskPostOption[];
}
