import { getDashboardProjects } from "@/features/projects/queries";

export default async function DashboardPage() {
  const projects = await getDashboardProjects();
  const activeProjects = projects.filter((project) => project.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">本日の業務</p>
        <h1 className="mt-1 text-2xl font-semibold">ダッシュボード</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-muted-foreground">管理案件数</p>
          <p className="mt-3 text-3xl font-semibold">{activeProjects.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-muted-foreground">確認待ち</p>
          <p className="mt-3 text-3xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-muted-foreground">期限超過</p>
          <p className="mt-3 text-3xl font-semibold">0</p>
        </div>
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">担当案件</h2>
        </div>
        <div className="divide-y">
          {activeProjects.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              まだ表示できる案件がありません。管理者に案件メンバーとして追加してもらってください。
            </p>
          ) : (
            activeProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.company_name ?? "会社名未設定"}</p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {project.industry ?? "業種未設定"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
