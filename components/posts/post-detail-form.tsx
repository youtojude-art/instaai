"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updatePostContent } from "@/features/posts/actions";
import type { ContentPostDetail } from "@/features/posts/queries";

type PostDetailFormProps = {
  post: ContentPostDetail;
};

export function PostDetailForm({ post }: PostDetailFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-lg border bg-white p-5"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await updatePostContent(formData);
          setMessage(result.message);
        });
      }}
    >
      <input type="hidden" name="postId" value={post.id} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">投稿タイトル</span>
        <Input name="title" defaultValue={post.title} required />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">投稿本文</span>
        <Textarea name="caption" defaultValue={post.caption ?? ""} className="min-h-96" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">CTA</span>
        <Input name="cta" defaultValue={post.cta ?? ""} placeholder="例: 詳細はプロフィールのリンクから" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">ハッシュタグ</span>
        <Input name="hashtags" defaultValue={post.hashtags.join(" ")} placeholder="#ハンバーガー #ランチ" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">投稿予定日時</span>
        <Input name="scheduledAt" type="datetime-local" defaultValue={toDateTimeLocalValue(post.scheduled_at)} />
      </label>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "投稿内容を保存"}
        </Button>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
