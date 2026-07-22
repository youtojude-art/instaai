import { MonthlyReportGenerator } from "@/components/reports/monthly-report-generator";
import { getDashboardProjects } from "@/features/projects/queries";

export default async function ReportsPage() {
  const projects = await getDashboardProjects();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">レポート管理</p>
        <h1 className="mt-1 text-2xl font-semibold">月次レポート</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          入力済みの投稿実績から、月間サマリー、改善点、翌月方針をAIが作成します。
        </p>
      </div>

      <MonthlyReportGenerator projects={projects} />
    </div>
  );
}
