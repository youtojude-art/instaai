"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updatePostStatus } from "@/features/posts/actions";

const statuses = [
  { value: "idea", label: "アイデア" },
  { value: "planning", label: "企画中" },
  { value: "staff_review", label: "事務確認中" },
  { value: "approval_waiting", label: "承認待ち" },
  { value: "approved", label: "承認済み" },
  { value: "scheduled", label: "投稿予約済み" },
  { value: "published", label: "投稿済み" },
  { value: "on_hold", label: "保留" },
  { value: "rejected", label: "却下" }
];

type PostStatusFormProps = {
  postId: string;
  status: string;
};

export function PostStatusForm({ postId, status }: PostStatusFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-lg border bg-white p-5"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await updatePostStatus(formData);
          setMessage(result.message);
        });
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <div>
        <h2 className="font-semibold">ステータス</h2>
        <p className="mt-1 text-sm text-muted-foreground">投稿の進行状況を管理します。</p>
      </div>
      <select name="status" defaultValue={status} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
        {statuses.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={isPending}>
        {isPending ? "更新中..." : "ステータスを更新"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
