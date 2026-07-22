import { createClient } from "@/lib/supabase/server";

export type CalendarPost = {
  id: string;
  title: string;
  content_type: "carousel" | "reel" | "story" | "image" | "other";
  status: string;
  scheduled_at: string;
  projects: {
    name: string;
  } | null;
};

export type CalendarMonth = {
  year: number;
  month: number;
  start: Date;
  end: Date;
};

export function getCalendarMonth(monthParam?: string): CalendarMonth {
  const now = new Date();
  const matched = monthParam?.match(/^(\d{4})-(\d{2})$/);
  const year = matched ? Number(matched[1]) : now.getFullYear();
  const month = matched ? Number(matched[2]) : now.getMonth() + 1;
  const normalizedMonth = month >= 1 && month <= 12 ? month : now.getMonth() + 1;
  const normalizedYear = Number.isFinite(year) ? year : now.getFullYear();
  const start = new Date(normalizedYear, normalizedMonth - 1, 1);
  const end = new Date(normalizedYear, normalizedMonth, 1);

  return {
    year: start.getFullYear(),
    month: start.getMonth() + 1,
    start,
    end
  };
}

export async function getCalendarPosts(calendarMonth: CalendarMonth): Promise<CalendarPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .select("id,title,content_type,status,scheduled_at,projects(name)")
    .is("deleted_at", null)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", calendarMonth.start.toISOString())
    .lt("scheduled_at", calendarMonth.end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as unknown as CalendarPost[];
}

export function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
