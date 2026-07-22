"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/features/chat/actions";

type ChatComposerProps = {
  selectedProjectId: string | null;
  disabled: boolean;
};

export function ChatComposer({ selectedProjectId, disabled }: ChatComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="space-y-2"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await sendChatMessage(formData);
          setMessage(result.ok ? null : result.message);
          if (result.ok) {
            formRef.current?.reset();
          }
        });
      }}
    >
      <input type="hidden" name="projectId" value={selectedProjectId ?? ""} />
      <div className="flex items-end gap-2 rounded-lg border bg-white p-2">
        <Button variant="ghost" type="button" aria-label="ファイル添付" disabled>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          name="content"
          className="max-h-48 min-h-12 flex-1 resize-y border-0 bg-transparent px-2 py-3 focus:ring-0"
          placeholder={disabled ? "先に案件を選択してください" : "例: 今月の投稿企画を作って"}
          disabled={disabled || isPending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          required
        />
        <Button type="submit" className="gap-2" disabled={disabled || isPending}>
          <Send className="h-4 w-4" />
          {isPending ? "送信中..." : "送信"}
        </Button>
      </div>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </form>
  );
}
