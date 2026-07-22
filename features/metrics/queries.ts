import { createClient } from "@/lib/supabase/server";

export type PostMetric = {
  id: string;
  project_id: string;
  post_id: string;
  instagram_url: string | null;
  measured_at: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  video_views: number;
  profile_accesses: number;
  website_clicks: number;
  line_adds: number;
  inquiries: number;
  reservations: number;
  purchases: number;
  sales_amount: number;
  source: "manual" | "instagram_api";
  notes: string | null;
  updated_at: string;
  content_posts: {
    title: string;
    content_type: string;
    status: string;
  } | null;
  projects: {
    name: string;
  } | null;
};

export type MetricPostOption = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  projects: {
    name: string;
  } | null;
};

export async function getPostMetric(postId: string): Promise<PostMetric | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_metrics")
    .select("id,project_id,post_id,instagram_url,measured_at,reach,impressions,likes,comments,saves,shares,video_views,profile_accesses,website_clicks,line_adds,inquiries,reservations,purchases,sales_amount,source,notes,updated_at,content_posts(title,content_type,status),projects(name)")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as unknown as PostMetric | null;
}

export async function getPostMetrics(): Promise<PostMetric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_metrics")
    .select("id,project_id,post_id,instagram_url,measured_at,reach,impressions,likes,comments,saves,shares,video_views,profile_accesses,website_clicks,line_adds,inquiries,reservations,purchases,sales_amount,source,notes,updated_at,content_posts(title,content_type,status),projects(name)")
    .is("deleted_at", null)
    .order("measured_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as PostMetric[];
}

export async function getMetricPostOptions(): Promise<MetricPostOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id,project_id,title,status,projects(name)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as MetricPostOption[];
}
