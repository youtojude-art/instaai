"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveChatMessageAsPost } from "@/features/posts/actions";

type SaveChatMessageButtonProps = {
  messageId: string;
};

export function SaveChatMessageButton({ messageId }: SaveChatMessageButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="mt-3"
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await saveChatMessageAsPost(formData);
          setMessage(result.message);
        });
      }}
    >
      <input type="hidden" name="messageId" value={messageId} />
      <Button type="submit" variant="secondary" className="h-9 gap-2" disabled={isPending}>
        <Save className="h-4 w-4" />
        {isPending ? "保存中..." : "投稿案として保存"}
      </Button>
      {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
