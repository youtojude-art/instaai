"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeProjectMetrics } from "@/features/metrics/actions";
import type { DashboardProject } from "@/features/projects/queries";
import type { PostMetric } from "@/features/metrics/queries";

type ProjectMetricAnalysisPanelProps = {
  projects: DashboardProject[];
  metrics: PostMetric[];
};

export function ProjectMetricAnalysisPanel({ projects, metrics }: ProjectMetricAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const projectIdsWithMetrics = new Set(metrics.map((metric) => metric.project_id));
  const analyzableProjects = projects.filter((project) => projectIdsWithMetrics.has(project.id));

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">案件実績分析AI</h2>
          <p className="mt-1 text-sm text-muted-foreground">案件内の入力済み実績を比較し、次の運用方針を生成します。</p>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3 md:flex-row"
        action={(formData) => {
          setAnalysis(null);
          startTransition(async () => {
            const result = await analyzeProjectMetrics(formData);
            setAnalysis(result.message);
          });
        }}
      >
        <select name="projectId" className="h-10 min-w-64 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring" required>
          {analyzableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isPending || analyzableProjects.length === 0} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {isPending ? "分析中..." : "案件全体をAI分析"}
        </Button>
      </form>

      {analyzableProjects.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">先に投稿実績を1件以上保存すると、案件全体のAI分析を使えます。</p>
      ) : null}

      {analysis ? (
        <div className="mt-4 whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-7">
          {analysis}
        </div>
      ) : null}
    </section>
  );
}
