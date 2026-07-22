import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  postId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueAt: z.string().trim().optional()
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "doing", "review_waiting", "done", "blocked"])
});

export const extractPostTasksSchema = z.object({
  postId: z.string().uuid()
});

export const createExtractedTasksSchema = z.object({
  postId: z.string().uuid(),
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().max(1000).optional(),
        priority: z.enum(["low", "medium", "high"])
      })
    )
    .min(1)
    .max(10)
});
