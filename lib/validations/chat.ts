import { z } from "zod";

export const sendChatMessageSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000)
});
