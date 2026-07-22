"use client";

import { useState, useTransition } from "react";
import { updateContentTaskStatus } from "@/features/tasks/actions";

type TaskStatusFormProps = {
  taskId: string;
  status: string;
};

export function TaskStatusForm({ taskId, status }: TaskStatusFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await updateContentTaskStatus(formData);
          setMessage(result.ok ? null : result.message);
        });
      }}
      className="space-y-1"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={status}
        disabled={isPending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 w-full rounded-md border bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="todo">未着手</option>
        <option value="doing">対応中</option>
        <option value="review_waiting">確認待ち</option>
        <option value="done">完了</option>
        <option value="blocked">停止中</option>
      </select>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
