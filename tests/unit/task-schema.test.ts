import { describe, expect, it } from "vitest";
import {
  createExtractedTasksSchema,
  createTaskSchema,
  extractPostTasksSchema,
  updateTaskStatusSchema
} from "@/lib/validations/task";

const id = "00000000-0000-4000-8000-000000000001";

describe("task schemas", () => {
  it("accepts task creation", () => {
    const result = createTaskSchema.safeParse({
      projectId: id,
      postId: "",
      title: "素材を確認する",
      description: "写真が揃っているか確認",
      priority: "medium",
      dueAt: "2026-07-23T18:30"
    });

    expect(result.success).toBe(true);
  });

  it("accepts task status updates", () => {
    const result = updateTaskStatusSchema.safeParse({
      taskId: id,
      status: "done"
    });

    expect(result.success).toBe(true);
  });

  it("accepts task extraction input", () => {
    const result = extractPostTasksSchema.safeParse({
      postId: id
    });

    expect(result.success).toBe(true);
  });

  it("accepts extracted task creation input", () => {
    const result = createExtractedTasksSchema.safeParse({
      postId: id,
      tasks: [
        {
          title: "画像案を確認する",
          description: "生成した画像が投稿内容と合っているか確認",
          priority: "medium"
        }
      ]
    });

    expect(result.success).toBe(true);
  });
});
