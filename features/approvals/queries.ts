import { createClient } from "@/lib/supabase/server";

export type ApprovalQueuePost = {
  id: string;
  title: string;
  content_type: "carousel" | "reel" | "story" | "image" | "other";
  status: string;
  scheduled_at: string | null;
  updated_at: string;
  projects: {
    name: string;
  } | null;
};

export async function getApprovalQueuePosts(): Promise<ApprovalQueuePost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id,title,content_type,status,scheduled_at,updated_at,projects(name)")
    .is("deleted_at", null)
    .in("status", ["approval_waiting", "approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as ApprovalQueuePost[];
}
