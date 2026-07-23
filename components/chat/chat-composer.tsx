"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/features/chat/actions";
import { chatImageMimeTypes, maxChatImageBytes } from "@/lib/validations/chat";

type ChatComposerProps = {
  selectedProjectId: string | null;
  disabled: boolean;
};

export function ChatComposer({ selectedProjectId, disabled }: ChatComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [image, setImage] = useState<{
    dataUrl: string;
    mimeType: string;
    name: string;
    size: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function clearImage() {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage(null);

    if (!file) {
      clearImage();
      return;
    }

    if (!chatImageMimeTypes.includes(file.type as (typeof chatImageMimeTypes)[number])) {
      clearImage();
      setMessage("画像はJPEG、PNG、WebPを選択してください。");
      return;
    }

    if (file.size > maxChatImageBytes) {
      clearImage();
      setMessage("画像は2MB以下にしてください。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setMessage("画像を読み込めませんでした。");
        return;
      }

      setImage({
        dataUrl: reader.result,
        mimeType: file.type,
        name: file.name,
        size: file.size
      });
    };
    reader.onerror = () => setMessage("画像を読み込めませんでした。");
    reader.readAsDataURL(file);
  }

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
            clearImage();
          }
        });
      }}
    >
      <input type="hidden" name="projectId" value={selectedProjectId ?? ""} />
      <input type="hidden" name="imageDataUrl" value={image?.dataUrl ?? ""} />
      <input type="hidden" name="imageMimeType" value={image?.mimeType ?? ""} />
      <input type="hidden" name="imageName" value={image?.name ?? ""} />
      <input type="hidden" name="imageSize" value={image?.size ?? ""} />
      <input ref={fileInputRef} type="file" accept={chatImageMimeTypes.join(",")} className="hidden" onChange={handleImageChange} />
      {image ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-white p-2">
          <div className="flex min-w-0 items-center gap-3">
            <img src={image.dataUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{image.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
            </div>
          </div>
          <Button variant="ghost" type="button" className="h-9 w-9 px-0" aria-label="添付画像を削除" onClick={clearImage} disabled={isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-lg border bg-white p-2">
        <Button
          variant="ghost"
          type="button"
          className="h-10 w-10 px-0"
          aria-label="画像を添付"
          title="画像を添付"
          disabled={disabled || isPending}
          onClick={() => fileInputRef.current?.click()}
        >
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
          required={!image}
        />
        <Button type="submit" className="gap-2" disabled={disabled || isPending}>
          {image ? <ImagePlus className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {isPending ? "送信中..." : "送信"}
        </Button>
      </div>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </form>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
