import { z } from "zod";

const optionalText = z
  .string()
  .max(120)
  .optional()
  .transform((value) => value?.trim() ?? "");

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  companyName: optionalText,
  shopName: optionalText,
  industry: optionalText
});
