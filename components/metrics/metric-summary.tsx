import Link from "next/link";
import { ExternalLink, TrendingUp } from "lucide-react";
import type { PostMetric } from "@/features/metrics/queries";

type MetricSummaryProps = {
  metrics: PostMetric[];
  emptyMessage: string;
};

export function MetricSummary({ metrics, emptyMessage }: MetricSummaryProps) {
  if (metrics.length === 0) {
    return <p className="px-5 py-8 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y">
      {metrics.map((metric) => {
        const engagement = metric.likes + metric.comments + metric.saves + metric.shares;
        const engagementRate = metric.reach > 0 ? ((engagement / metric.reach) * 100).toFixed(1) : "0.0";

        return (
          <div key={metric.id} className="grid gap-4 px-5 py-4 text-sm xl:grid-cols-[1.4fr_1fr_120px_120px_120px]">
            <div>
              <Link href={`/posts/${metric.post_id}`} className="font-medium text-primary hover:underline">
                {metric.content_posts?.title ?? "投稿詳細"}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{metric.projects?.name ?? "案件未設定"} / {formatDateTime(metric.measured_at)}</p>
              {metric.instagram_url ? (
                <a href={metric.instagram_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Instagramを開く
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <MetricChip label="いいね" value={metric.likes} />
              <MetricChip label="保存" value={metric.saves} />
              <MetricChip label="コメント" value={metric.comments} />
              <MetricChip label="シェア" value={metric.shares} />
            </div>
            <MetricLarge label="リーチ" value={metric.reach} />
            <MetricLarge label="表示回数" value={metric.impressions} />
            <div className="rounded-md border p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                反応率
              </p>
              <p className="mt-2 text-lg font-semibold">{engagementRate}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1">
      {label}: {value.toLocaleString("ja-JP")}
    </span>
  );
}

function MetricLarge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value.toLocaleString("ja-JP")}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
