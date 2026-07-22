import { createClient } from "@/lib/supabase/server";

export type ContentPostListItem = {
  id: string;
  project_id: string;
  title: string;
  content_type: "carousel" | "reel" | "story" | "image" | "other";
  status: string;
  priority: string;
  scheduled_at: string | null;
  created_at: string;
  projects: {
    name: string;
  } | null;
};

export type ContentPostDetail = {
  id: string;
  project_id: string;
  title: string;
  content_type: "carousel" | "reel" | "story" | "image" | "other";
  category: string | null;
  objective: string | null;
  status: string;
  priority: string;
  scheduled_at: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string[];
  ai_payload: {
    source?: string;
    sourceChatMessageId?: string;
  } | null;
  created_at: string;
  updated_at: string;
  projects: {
    name: string;
  } | null;
};

export type ContentVersion = {
  id: string;
  version_number: number;
  title: string;
  caption: string | null;
  cta: string | null;
  hashtags: string[];
  change_note: string | null;
  created_at: string;
};

export type ContentApproval = {
  id: string;
  action: "requested" | "approved" | "rejected" | "cancelled";
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  users: {
    name: string;
    email: string;
  } | null;
};

export async function getContentPosts(): Promise<ContentPostListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id,project_id,title,content_type,status,priority,scheduled_at,created_at,projects(name)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as unknown as ContentPostListItem[];
}

export async function getContentPostDetail(postId: string) {
  const supabase = await createClient();
  const [postResult, versionsResult, approvalsResult] = await Promise.all([
    supabase
      .from("content_posts")
      .select("id,project_id,title,content_type,category,objective,status,priority,scheduled_at,caption,cta,hashtags,ai_payload,created_at,updated_at,projects(name)")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("content_versions")
      .select("id,version_number,title,caption,cta,hashtags,change_note,created_at")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("version_number", { ascending: false }),
    supabase
      .from("content_approvals")
      .select("id,action,from_status,to_status,note,created_at,users(name,email)")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
  ]);

  return {
    post: postResult.data as unknown as ContentPostDetail | null,
    versions: (versionsResult.data ?? []) as ContentVersion[],
    approvals: (approvalsResult.data ?? []) as unknown as ContentApproval[]
  };
}
