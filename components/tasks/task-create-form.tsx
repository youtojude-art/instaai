"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createContentTask } from "@/features/tasks/actions";
import type { DashboardProject } from "@/features/projects/queries";
import type { TaskPostOption } from "@/features/tasks/queries";

type TaskCreateFormProps = {
  projects: DashboardProject[];
  posts: TaskPostOption[];
  defaultPost?: {
    id: string;
    projectId: string;
    title: string;
  };
};

export function TaskCreateForm({ projects, posts, defaultPost }: TaskCreateFormProps) {
  const [projectId, setProjectId] = useState(defaultPost?.projectId ?? projects[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectablePosts = useMemo(() => posts.filter((post) => post.project_id === projectId), [posts, projectId]);

  return (
    <form
      className="space-y-4 rounded-lg border bg-white p-5"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await createContentTask(formData);
          setMessage(result.message);
        });
      }}
    >
      <div>
        <h2 className="font-semibold">タスク作成</h2>
        <p className="mt-1 text-sm text-muted-foreground">素材準備、デザイン、投稿予約、数値入力などの作業を登録します。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium">案件</span>
          <select
            name="projectId"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">関連投稿</span>
          <select name="postId" defaultValue={defaultPost?.id ?? ""} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="">投稿に紐づけない</option>
            {defaultPost ? (
              <option value={defaultPost.id}>{defaultPost.title}</option>
            ) : null}
            {selectablePosts
              .filter((post) => post.id !== defaultPost?.id)
              .map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">タスク名</span>
        <Input name="title" placeholder="例: 投稿画像の素材を回収する" required />
      </label>

      <Textarea name="description" placeholder="作業メモ、確認事項、依頼内容など" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium">優先度</span>
          <select name="priority" defaultValue="medium" className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">期限</span>
          <Input name="dueAt" type="datetime-local" />
        </label>
      </div>

      <Button type="submit" disabled={isPending || projects.length === 0} className="gap-2">
        <Plus className="h-4 w-4" />
        {isPending ? "作成中..." : "タスクを作成"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
