"use client";

import { useState, useTransition } from "react";
import { Download, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generatePostImage } from "@/features/images/actions";

type PostImageGeneratorProps = {
  postId: string;
  defaultPrompt: string;
};

type GeneratedImage = {
  imageDataUrl: string;
  prompt: string;
  format: "feed" | "story";
};

export function PostImageGenerator({ postId, defaultPrompt }: PostImageGeneratorProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="flex items-start gap-3">
        <ImageIcon className="mt-1 h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="font-semibold">投稿イメージ画像生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">高品質設定で、フィードまたはストーリー用の完成イメージを生成します。</p>
        </div>
      </div>

      <form
        className="mt-4 space-y-4"
        action={(formData) => {
          const format = formData.get("format") === "story" ? "story" : "feed";
          setMessage(null);
          startTransition(async () => {
            const result = await generatePostImage(formData);
            setMessage(result.message);
            if (result.ok) {
              setGeneratedImage({
                imageDataUrl: result.imageDataUrl,
                prompt: result.prompt,
                format
              });
            }
          });
        }}
      >
        <input type="hidden" name="postId" value={postId} />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
            <input type="radio" name="format" value="feed" defaultChecked />
            <span>
              <span className="block font-medium">フィード</span>
              <span className="text-xs text-muted-foreground">正方形 1:1</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
            <input type="radio" name="format" value="story" />
            <span>
              <span className="block font-medium">ストーリー</span>
              <span className="text-xs text-muted-foreground">縦長 9:16</span>
            </span>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">追加指示</span>
          <Textarea name="extraPrompt" defaultValue={defaultPrompt} className="min-h-72" />
        </label>

        <Button type="submit" disabled={isPending} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {isPending ? "生成中..." : "画像を生成"}
        </Button>
      </form>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}

      {generatedImage ? (
        <div className="mt-5 space-y-4">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <img
              src={generatedImage.imageDataUrl}
              alt={generatedImage.format === "feed" ? "フィード投稿イメージ" : "ストーリー投稿イメージ"}
              className="mx-auto max-h-[720px] w-auto max-w-full object-contain"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={generatedImage.imageDataUrl}
              download={`instagram-${generatedImage.format}-image.png`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              画像をダウンロード
            </a>
          </div>
          <details className="rounded-md border p-3 text-sm">
            <summary className="cursor-pointer font-medium">生成プロンプトを確認</summary>
            <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{generatedImage.prompt}</pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}
