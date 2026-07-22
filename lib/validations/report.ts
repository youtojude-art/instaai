import { z } from "zod";

export const generateMonthlyReportSchema = z.object({
  projectId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/)
});
