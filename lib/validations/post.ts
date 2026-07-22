import { z } from "zod";

export const saveChatMessageAsPostSchema = z.object({
  messageId: z.string().uuid()
});

export const updatePostStatusSchema = z.object({
  postId: z.string().uuid(),
  status: z.enum([
    "idea",
    "planning",
    "staff_review",
    "approval_waiting",
    "approved",
    "scheduled",
    "published",
    "on_hold",
    "rejected"
  ])
});

export const updatePostContentSchema = z.object({
  postId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  caption: z.string().trim().max(10000).optional(),
  cta: z.string().trim().max(500).optional(),
  hashtags: z.string().trim().max(1000).optional(),
  scheduledAt: z.string().trim().optional()
});

export const submitPostApprovalSchema = z.object({
  postId: z.string().uuid(),
  action: z.enum(["requested", "approved", "rejected", "cancelled"]),
  note: z.string().trim().max(1000).optional()
});

export const generatePostImageSchema = z.object({
  postId: z.string().uuid(),
  format: z.enum(["feed", "story"]),
  extraPrompt: z.string().trim().max(1000).optional()
});
