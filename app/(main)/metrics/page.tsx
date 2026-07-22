import { MetricForm } from "@/components/metrics/metric-form";
import { MetricSummary } from "@/components/metrics/metric-summary";
import { ProjectMetricAnalysisPanel } from "@/components/metrics/project-metric-analysis-panel";
import { getMetricPostOptions, getPostMetrics } from "@/features/metrics/queries";
import { getDashboardProjects } from "@/features/projects/queries";

export default async function MetricsPage() {
  const [projects, posts, metrics] = await Promise.all([
    getDashboardProjects(),
    getMetricPostOptions(),
    getPostMetrics()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">分析管理</p>
        <h1 className="mt-1 text-2xl font-semibold">投稿実績入力</h1>
        <p className="mt-2 text-sm text-muted-foreground">Instagramインサイトの数値を投稿ごとに保存します。将来の自動連携でも同じ実績データを使います。</p>
      </div>

      <MetricForm posts={posts} />

      <ProjectMetricAnalysisPanel projects={projects} metrics={metrics} />

      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">入力済み実績</h2>
        </div>
        <MetricSummary metrics={metrics} emptyMessage="まだ投稿実績が入力されていません。" />
      </section>
    </div>
  );
}
