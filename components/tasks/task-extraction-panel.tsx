"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createExtractedTasks, extractPostTasks } from "@/features/tasks/actions";

type TaskExtractionPanelProps = {
  postId: string;
};

type ExtractedTask = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  selected: boolean;
};

const priorityLabels: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

export function TaskExtractionPanel({ postId }: TaskExtractionPanelProps) {
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isExtracting, startExtracting] = useTransition();
  const [isCreating, startCreating] = useTransition();

  const selectedTasks = tasks.filter((task) => task.selected);

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">AIタスク抽出</h3>
          <p className="mt-1 text-sm text-muted-foreground">投稿内容から、必要な運用タスク候補を自動で作成します。</p>
        </div>
        <form
          action={(formData) => {
            setMessage(null);
            startExtracting(async () => {
              const result = await extractPostTasks(formData);
              setMessage(result.message);
              if (result.ok) {
                setTasks(result.tasks.map((task) => ({ ...task, selected: true })));
              }
            });
          }}
        >
          <input type="hidden" name="postId" value={postId} />
          <Button type="submit" disabled={isExtracting} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isExtracting ? "抽出中..." : "AIでタスク抽出"}
          </Button>
        </form>
      </div>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}

      {tasks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {tasks.map((task, index) => (
            <label key={`${task.title}-${index}`} className="flex gap-3 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                checked={task.selected}
                onChange={(event) => {
                  setTasks((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, selected: event.target.checked } : item
                    )
                  );
                }}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{task.title}</span>
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  優先度 {priorityLabels[task.priority]}
                </span>
                <span className="mt-1 block text-muted-foreground">{task.description}</span>
              </span>
            </label>
          ))}

          <Button
            type="button"
            disabled={isCreating || selectedTasks.length === 0}
            onClick={() => {
              setMessage(null);
              startCreating(async () => {
                const result = await createExtractedTasks({
                  postId,
                  tasks: selectedTasks.map(({ selected: _selected, ...task }) => task)
                });
                setMessage(result.message);
                if (result.ok) {
                  setTasks([]);
                }
              });
            }}
          >
            {isCreating ? "作成中..." : `選択した${selectedTasks.length}件を作成`}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
