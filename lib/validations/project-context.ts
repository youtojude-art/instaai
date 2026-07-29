import { z } from "zod";

const optionalLongText = z
  .string()
  .max(3000)
  .optional()
  .transform((value) => value?.trim() ?? "");

const optionalShortText = z
  .string()
  .max(160)
  .optional()
  .transform((value) => value?.trim() ?? "");

export const brandProfileSchema = z.object({
  projectId: z.string().uuid(),
  concept: optionalLongText,
  tone: optionalLongText,
  speakingRules: optionalLongText,
  requiredAppeals: optionalLongText,
  prohibitedWords: optionalLongText,
  legalNotes: optionalLongText,
  colors: optionalShortText,
  fonts: optionalShortText
});

export const targetProfileSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  ageRange: optionalShortText,
  gender: optionalShortText,
  area: optionalShortText,
  occupation: optionalShortText,
  lifestyle: optionalLongText,
  pains: optionalLongText,
  desires: optionalLongText,
  behaviorNotes: optionalLongText
});

export const aiEmployeeSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  personality: optionalLongText,
  speakingStyle: optionalLongText,
  taskScope: optionalLongText,
  writingAmount: z.enum(["short", "medium", "long"]),
  emojiAmount: z.enum(["none", "low", "medium", "high"]),
  salesTone: z.enum(["low", "medium", "high"]),
  proactiveSuggestions: z.enum(["true", "false"])
});

export const referenceAccountSchema = z.object({
  projectId: z.string().uuid(),
  accountName: z.string().trim().min(1).max(120),
  accountUrl: z.string().trim().url().max(500).optional().or(z.literal("")).transform((value) => value || ""),
  reason: optionalLongText,
  strengths: optionalLongText,
  visualNotes: optionalLongText,
  contentNotes: optionalLongText,
  avoidNotes: optionalLongText,
  applyNotes: optionalLongText
});
