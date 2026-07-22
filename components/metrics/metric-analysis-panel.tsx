"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzePostMetric } from "@/features/metrics/actions";

type MetricAnalysisPanelProps = {
  postId: string;
  hasMetric: boolean;
};

export function MetricAnalysisPanel({ postId, hasMetric }: MetricAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">実績分析AI</h2>
          <p className="mt-1 text-sm text-muted-foreground">保存済みの実績から、次回投稿の改善提案を生成します。</p>
        </div>
        <form
          action={(formData) => {
            setAnalysis(null);
            startTransition(async () => {
              const result = await analyzePostMetric(formData);
              setAnalysis(result.message);
            });
          }}
        >
          <input type="hidden" name="postId" value={postId} />
          <Button type="submit" disabled={isPending || !hasMetric} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isPending ? "分析中..." : "AIに改善提案してもらう"}
          </Button>
        </form>
      </div>

      {!hasMetric ? (
        <p className="mt-4 text-sm text-muted-foreground">先にこの投稿の実績を保存すると、AI分析を使えます。</p>
      ) : null}

      {analysis ? (
        <div className="mt-4 whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-7">
          {analysis}
        </div>
      ) : null}
    </section>
  );
}
