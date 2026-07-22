"use client";

import { useMemo, useState, useTransition } from "react";
import { BarChart3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertPostMetric } from "@/features/metrics/actions";
import type { MetricPostOption, PostMetric } from "@/features/metrics/queries";

type MetricFormProps = {
  posts: MetricPostOption[];
  metric?: PostMetric | null;
  defaultPost?: {
    id: string;
    title: string;
  };
};

const metricFields = [
  { name: "reach", label: "リーチ" },
  { name: "impressions", label: "表示回数" },
  { name: "likes", label: "いいね" },
  { name: "comments", label: "コメント" },
  { name: "saves", label: "保存" },
  { name: "shares", label: "シェア" },
  { name: "videoViews", label: "動画再生" },
  { name: "profileAccesses", label: "プロフィールアクセス" },
  { name: "websiteClicks", label: "Webクリック" },
  { name: "lineAdds", label: "LINE追加" },
  { name: "inquiries", label: "問い合わせ" },
  { name: "reservations", label: "予約" },
  { name: "purchases", label: "購入" },
  { name: "salesAmount", label: "売上金額" }
] as const;

export function MetricForm({ posts, metric, defaultPost }: MetricFormProps) {
  const [postId, setPostId] = useState(defaultPost?.id ?? posts[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedPost = useMemo(() => posts.find((post) => post.id === postId), [posts, postId]);

  return (
    <form
      className="space-y-4 rounded-lg border bg-white p-5"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await upsertPostMetric(formData);
          setMessage(result.message);
        });
      }}
    >
      <div className="flex items-start gap-3">
        <BarChart3 className="mt-1 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">投稿実績入力</h2>
          <p className="mt-1 text-sm text-muted-foreground">Instagramのインサイト画面を見ながら、投稿ごとの実績を入力します。</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium">投稿</span>
          {defaultPost ? (
            <>
              <input type="hidden" name="postId" value={defaultPost.id} />
              <Input value={defaultPost.title} readOnly />
            </>
          ) : (
            <select
              name="postId"
              value={postId}
              onChange={(event) => setPostId(event.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              required
            >
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.projects?.name ?? "案件未設定"} / {post.title}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">計測日時</span>
          <Input name="measuredAt" type="datetime-local" defaultValue={toDateTimeLocalValue(metric?.measured_at ?? null)} />
        </label>
      </div>

      {selectedPost && !defaultPost ? (
        <p className="text-sm text-muted-foreground">選択中: {selectedPost.projects?.name ?? "案件未設定"} / {selectedPost.status}</p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Instagram投稿URL</span>
        <Input name="instagramUrl" type="url" defaultValue={metric?.instagram_url ?? ""} placeholder="https://www.instagram.com/p/..." />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricFields.map((field) => (
          <label key={field.name} className="block space-y-2">
            <span className="text-sm font-medium">{field.label}</span>
            <Input name={field.name} type="number" min="0" step="1" defaultValue={getMetricDefaultValue(metric, field.name)} />
          </label>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">メモ</span>
        <Textarea name="notes" defaultValue={metric?.notes ?? ""} placeholder="反応が良かった理由、次回改善点など" />
      </label>

      <Button type="submit" disabled={isPending || (!defaultPost && posts.length === 0)} className="gap-2">
        <Save className="h-4 w-4" />
        {isPending ? "保存中..." : "実績を保存"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

function getMetricDefaultValue(metric: PostMetric | null | undefined, fieldName: (typeof metricFields)[number]["name"]) {
  if (!metric) {
    return 0;
  }

  const keyMap = {
    videoViews: "video_views",
    profileAccesses: "profile_accesses",
    websiteClicks: "website_clicks",
    lineAdds: "line_adds",
    salesAmount: "sales_amount"
  } as const;
  const dataKey = fieldName in keyMap ? keyMap[fieldName as keyof typeof keyMap] : fieldName;
  return metric[dataKey as keyof PostMetric] as number;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
