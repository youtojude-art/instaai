import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, ListTodo } from "lucide-react";
import { getCalendarMonth, getCalendarPosts, formatMonthParam, type CalendarPost } from "@/features/calendar/queries";

type CalendarPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

const statusLabels: Record<string, string> = {
  idea: "アイデア",
  planning: "企画中",
  staff_review: "事務確認中",
  approval_waiting: "承認待ち",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "投稿済み",
  on_hold: "保留",
  rejected: "却下"
};

const typeLabels: Record<string, string> = {
  carousel: "カルーセル",
  reel: "リール",
  story: "ストーリーズ",
  image: "画像",
  other: "その他"
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { month } = await searchParams;
  const calendarMonth = getCalendarMonth(month);
  const posts = await getCalendarPosts(calendarMonth);
  const weeks = buildCalendarWeeks(calendarMonth.year, calendarMonth.month, posts);
  const previousMonth = new Date(calendarMonth.year, calendarMonth.month - 2, 1);
  const nextMonth = new Date(calendarMonth.year, calendarMonth.month, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">投稿管理</p>
          <h1 className="mt-1 text-2xl font-semibold">投稿カレンダー</h1>
          <p className="mt-2 text-sm text-muted-foreground">投稿詳細で予定日時を入れた投稿案が月間表示されます。</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${formatMonthParam(previousMonth)}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white hover:bg-muted"
            aria-label="前月"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-36 rounded-md border bg-white px-4 py-2 text-center font-semibold">
            {calendarMonth.year}年{calendarMonth.month}月
          </div>
          <Link
            href={`/calendar?month=${formatMonthParam(nextMonth)}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white hover:bg-muted"
            aria-label="翌月"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="rounded-lg border bg-white">
        <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x">
              {week.map((day) => (
                <div key={day.key} className={`min-h-36 p-2 ${day.isCurrentMonth ? "bg-white" : "bg-muted/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${day.isToday ? "rounded-full bg-primary px-2 py-0.5 text-primary-foreground" : day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                      {day.date.getDate()}
                    </span>
                    {day.posts.length > 0 ? (
                      <span className="text-xs text-muted-foreground">{day.posts.length}件</span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-2">
                    {day.posts.slice(0, 3).map((post) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="block rounded-md border border-l-4 border-l-primary bg-white px-2 py-2 text-left shadow-sm hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(post.scheduled_at)}
                        </span>
                        <span className="mt-1 block truncate text-xs font-medium">{post.title}</span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                          {post.projects?.name ?? "案件未設定"} / {typeLabels[post.content_type] ?? post.content_type} / {statusLabels[post.status] ?? post.status}
                        </span>
                      </Link>
                    ))}
                    {day.posts.length > 3 ? (
                      <p className="text-xs text-muted-foreground">他 {day.posts.length - 3} 件</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">この月の投稿予定はまだありません</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                投稿一覧から投稿案を開き、投稿予定日時を保存するとここに表示されます。
              </p>
            </div>
          </div>
          <Link href="/posts" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            投稿一覧を開く
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function buildCalendarWeeks(year: number, month: number, posts: CalendarPost[]) {
  const firstDay = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - firstDay.getDay());
  const todayKey = toDateKey(new Date());
  const postsByDate = posts.reduce<Record<string, CalendarPost[]>>((acc, post) => {
    const key = toDateKey(new Date(post.scheduled_at));
    acc[key] = [...(acc[key] ?? []), post];
    return acc;
  }, {});

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      const key = toDateKey(date);

      return {
        key,
        date,
        isToday: key === todayKey,
        isCurrentMonth: date.getMonth() === month - 1,
        posts: postsByDate[key] ?? []
      };
    })
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}
