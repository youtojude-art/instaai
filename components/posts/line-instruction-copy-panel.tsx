"use client";

import { useMemo, useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createLineInstructionMessage } from "@/features/posts/line-message";
import type { ContentPostDetail } from "@/features/posts/queries";

type LineInstructionCopyPanelProps = {
  post: ContentPostDetail;
};

export function LineInstructionCopyPanel({ post }: LineInstructionCopyPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const lineText = useMemo(() => createLineInstructionMessage(post), [post]);

  async function copyText() {
    setMessage(null);

    try {
      await navigator.clipboard.writeText(lineText);
      setMessage("LINE用文面をコピーしました。");
    } catch {
      setMessage("コピーできませんでした。下の文面を選択してコピーしてください。");
    }
  }

  return (
    <section className="space-y-4 rounded-lg border bg-white p-5">
      <div className="flex items-start gap-3">
        <MessageCircle className="mt-1 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">LINE共有文</h2>
          <p className="mt-1 text-sm text-muted-foreground">投稿予約内容をクライアントへ送る文面です。</p>
        </div>
      </div>

      {!post.scheduled_at ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          投稿予定日時が未設定です。日時を入れると文面に反映されます。
        </p>
      ) : null}

      <Textarea value={lineText} readOnly className="min-h-72 text-xs leading-6" />

      <Button type="button" className="w-full gap-2" onClick={copyText}>
        <Copy className="h-4 w-4" />
        LINE用文面をコピー
      </Button>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
