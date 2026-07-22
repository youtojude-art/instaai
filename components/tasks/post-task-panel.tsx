import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskExtractionPanel } from "@/components/tasks/task-extraction-panel";
import { TaskList } from "@/components/tasks/task-list";
import type { DashboardProject } from "@/features/projects/queries";
import type { ContentTask, TaskPostOption } from "@/features/tasks/queries";

type PostTaskPanelProps = {
  post: {
    id: string;
    project_id: string;
    title: string;
  };
  projects: DashboardProject[];
  posts: TaskPostOption[];
  tasks: ContentTask[];
};

export function PostTaskPanel({ post, projects, posts, tasks }: PostTaskPanelProps) {
  return (
    <section className="space-y-4 rounded-lg border bg-white p-5">
      <div>
        <h2 className="font-semibold">関連タスク</h2>
        <p className="mt-1 text-sm text-muted-foreground">この投稿に必要な作業を管理します。</p>
      </div>
      <TaskExtractionPanel postId={post.id} />
      <TaskCreateForm projects={projects} posts={posts} defaultPost={{ id: post.id, projectId: post.project_id, title: post.title }} />
      <div className="overflow-hidden rounded-lg border">
        <TaskList tasks={tasks} emptyMessage="この投稿に紐づくタスクはまだありません。" />
      </div>
    </section>
  );
}
