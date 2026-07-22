"use client";

import { useState, useTransition } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMonthlyReport } from "@/features/reports/actions";
import type { DashboardProject } from "@/features/projects/queries";

type MonthlyReportGeneratorProps = {
  projects: DashboardProject[];
};

export function MonthlyReportGenerator({ projects }: MonthlyReportGeneratorProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="flex items-start gap-3">
        <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">月次レポート生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">案件と対象月を選ぶと、その月の投稿実績からAIが月次レポートを作成します。</p>
        </div>
      </div>

      <form
        className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto]"
        action={(formData) => {
          setReport(null);
          startTransition(async () => {
            const result = await generateMonthlyReport(formData);
            setReport(result.message);
          });
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">案件</span>
          <select name="projectId" className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring" required>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">対象月</span>
          <input
            name="month"
            type="month"
            defaultValue={getCurrentMonthValue()}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending || projects.length === 0} className="w-full gap-2 md:w-auto">
            <Sparkles className="h-4 w-4" />
            {isPending ? "生成中..." : "レポート生成"}
          </Button>
        </div>
      </form>

      {projects.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">先に案件を登録してください。</p>
      ) : null}

      {report ? (
        <div className="mt-5 whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-7">
          {report}
        </div>
      ) : null}
    </section>
  );
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
