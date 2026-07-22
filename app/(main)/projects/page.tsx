import Link from "next/link";
import { getDashboardProjects } from "@/features/projects/queries";
import { ProjectCreateForm } from "@/components/projects/project-create-form";

export default async function ProjectsPage() {
  const projects = await getDashboardProjects();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">案件管理</p>
        <h1 className="mt-1 text-2xl font-semibold">案件一覧</h1>
      </div>

      <ProjectCreateForm />

      <section className="rounded-lg border bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 border-b px-5 py-3 text-sm font-medium text-muted-foreground">
          <span>案件名</span>
          <span>会社名</span>
          <span>業種</span>
          <span>状態</span>
        </div>
        <div className="divide-y">
          {projects.map((project) => (
            <div key={project.id} className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 px-5 py-4 text-sm">
              <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                {project.name}
              </Link>
              <span>{project.company_name ?? "-"}</span>
              <span>{project.industry ?? "-"}</span>
              <span>{project.status === "active" ? "運用中" : "停止中"}</span>
            </div>
          ))}
          {projects.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">表示できる案件がありません。</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
