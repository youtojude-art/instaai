import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectContextForms } from "@/components/projects/project-context-forms";
import { getProjectWorkspace } from "@/features/projects/queries";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const workspace = await getProjectWorkspace(projectId);

  if (!workspace.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            案件一覧へ戻る
          </Link>
          <p className="mt-4 text-sm font-medium text-primary">案件詳細</p>
          <h1 className="mt-1 text-2xl font-semibold">{workspace.project.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {workspace.project.company_name ?? "会社名未設定"} / {workspace.project.industry ?? "業種未設定"}
          </p>
        </div>
        <Link
          href="/ai-chat"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          AI社員チャットへ
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard title="ブランド情報" done={Boolean(workspace.brandProfile)} />
        <StatusCard title="ターゲット情報" done={Boolean(workspace.targetProfile)} />
        <StatusCard title="AI社員設定" done={Boolean(workspace.aiEmployee)} />
      </section>

      <ProjectContextForms projectId={projectId} workspace={workspace} />
    </div>
  );
}

function StatusCard({ title, done }: { title: string; done: boolean }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={done ? "mt-3 text-lg font-semibold text-green-700" : "mt-3 text-lg font-semibold text-amber-700"}>
        {done ? "設定済み" : "未設定"}
      </p>
    </div>
  );
}
