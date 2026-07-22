import Link from "next/link";
import { AlertCircle, CalendarClock } from "lucide-react";
import { TaskStatusForm } from "@/components/tasks/task-status-form";
import type { ContentTask } from "@/features/tasks/queries";

type TaskListProps = {
  tasks: ContentTask[];
  emptyMessage: string;
};

const priorityLabels: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

export function TaskList({ tasks, emptyMessage }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="px-5 py-8 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y">
      {tasks.map((task) => (
        <div key={task.id} className="grid gap-4 px-5 py-4 text-sm md:grid-cols-[1.5fr_1fr_120px_140px]">
          <div>
            <div className="flex items-start gap-2">
              {task.priority === "high" ? <AlertCircle className="mt-0.5 h-4 w-4 text-primary" /> : null}
              <div>
                <p className="font-medium">{task.title}</p>
                {task.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p> : null}
                {task.post_id ? (
                  <Link href={`/posts/${task.post_id}`} className="mt-2 inline-block text-xs text-primary hover:underline">
                    {task.content_posts?.title ?? "関連投稿を開く"}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          <span>{task.projects?.name ?? "案件未設定"}</span>
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            優先度 {priorityLabels[task.priority] ?? task.priority}
          </span>
          <div className="space-y-2">
            <TaskStatusForm taskId={task.id} status={task.status} />
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              {task.due_at ? formatDateTime(task.due_at) : "期限未設定"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
