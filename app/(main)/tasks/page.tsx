import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskList } from "@/components/tasks/task-list";
import { getDashboardProjects } from "@/features/projects/queries";
import { getContentTasks, getTaskPostOptions } from "@/features/tasks/queries";

export default async function TasksPage() {
  const [projects, posts, tasks] = await Promise.all([
    getDashboardProjects(),
    getTaskPostOptions(),
    getContentTasks()
  ]);
  const activeTasks = tasks.filter((task) => task.status !== "done");
  const doneTasks = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">運用管理</p>
        <h1 className="mt-1 text-2xl font-semibold">タスク管理</h1>
        <p className="mt-2 text-sm text-muted-foreground">投稿制作、確認、予約、公開後入力までの作業を管理します。</p>
      </div>

      <TaskCreateForm projects={projects} posts={posts} />

      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">進行中タスク</h2>
        </div>
        <TaskList tasks={activeTasks} emptyMessage="進行中のタスクはありません。" />
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">完了タスク</h2>
        </div>
        <TaskList tasks={doneTasks} emptyMessage="完了済みタスクはまだありません。" />
      </section>
    </div>
  );
}
