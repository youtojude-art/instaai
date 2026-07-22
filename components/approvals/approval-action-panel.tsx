"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitPostApproval } from "@/features/posts/actions";
import type { ContentApproval } from "@/features/posts/queries";

type ApprovalActionPanelProps = {
  postId: string;
  status: string;
  approvals: ContentApproval[];
};

const actionLabels: Record<string, string> = {
  requested: "承認依頼",
  approved: "承認",
  rejected: "差し戻し",
  cancelled: "取り下げ"
};

const statusLabels: Record<string, string> = {
  idea: "アイデア",
  planning: "企画中",
  staff_review: "事務確認中",
  approval_waiting: "承認待ち",
  approved: "承認済み",
  scheduled: "投稿予約済み",
  published: "投稿済み",
  on_hold: "保留",
  rejected: "却下"
};

export function ApprovalActionPanel({ postId, status, approvals }: ApprovalActionPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitPostApproval(formData);
      setMessage(result.message);
    });
  }

  return (
    <section className="space-y-4 rounded-lg border bg-white p-5">
      <div>
        <h2 className="font-semibold">承認フロー</h2>
        <p className="mt-1 text-sm text-muted-foreground">現在: {statusLabels[status] ?? status}</p>
      </div>

      <form action={submit} className="space-y-3">
        <input type="hidden" name="postId" value={postId} />
        <Textarea name="note" placeholder="承認者へのメモ、差し戻し理由など" className="min-h-24" />
        <div className="grid gap-2">
          <ActionButton action="requested" disabled={isPending || status === "approval_waiting"} icon={<Send className="h-4 w-4" />}>
            承認依頼
          </ActionButton>
          <ActionButton action="approved" disabled={isPending || status === "approved"} icon={<Check className="h-4 w-4" />}>
            承認する
          </ActionButton>
          <ActionButton action="rejected" disabled={isPending || status === "rejected"} icon={<X className="h-4 w-4" />}>
            差し戻す
          </ActionButton>
          <ActionButton action="cancelled" disabled={isPending || status !== "approval_waiting"} icon={<RotateCcw className="h-4 w-4" />}>
            依頼を取り下げる
          </ActionButton>
        </div>
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold">承認履歴</h3>
        <div className="mt-3 space-y-3">
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ承認履歴はありません。</p>
          ) : (
            approvals.map((approval) => (
              <div key={approval.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {actionLabels[approval.action] ?? approval.action} / {statusLabels[approval.to_status] ?? approval.to_status}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {approval.users?.name ?? approval.users?.email ?? "担当者不明"} ・ {formatDateTime(approval.created_at)}
                </p>
                {approval.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{approval.note}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  action,
  disabled,
  icon,
  children
}: {
  action: "requested" | "approved" | "rejected" | "cancelled";
  disabled: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Button type="submit" name="action" value={action} variant={action === "approved" ? "primary" : "secondary"} disabled={disabled} className="justify-start gap-2">
      {icon}
      {children}
    </Button>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
