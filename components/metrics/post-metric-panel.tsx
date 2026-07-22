import { MetricForm } from "@/components/metrics/metric-form";
import { MetricAnalysisPanel } from "@/components/metrics/metric-analysis-panel";
import { MetricSummary } from "@/components/metrics/metric-summary";
import type { MetricPostOption, PostMetric } from "@/features/metrics/queries";

type PostMetricPanelProps = {
  post: {
    id: string;
    title: string;
  };
  posts: MetricPostOption[];
  metric: PostMetric | null;
};

export function PostMetricPanel({ post, posts, metric }: PostMetricPanelProps) {
  return (
    <section className="space-y-4">
      <MetricForm posts={posts} metric={metric} defaultPost={{ id: post.id, title: post.title }} />
      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">この投稿の実績</h2>
        </div>
        <MetricSummary metrics={metric ? [metric] : []} emptyMessage="この投稿の実績はまだ入力されていません。" />
      </section>
      <MetricAnalysisPanel postId={post.id} hasMetric={Boolean(metric)} />
    </section>
  );
}
