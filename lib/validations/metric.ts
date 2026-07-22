import { z } from "zod";

const nonNegativeNumberText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : 0))
  .pipe(z.number().finite().nonnegative());

export const upsertPostMetricSchema = z.object({
  postId: z.string().uuid(),
  instagramUrl: z.string().trim().url().optional().or(z.literal("")),
  measuredAt: z.string().trim().optional(),
  reach: nonNegativeNumberText,
  impressions: nonNegativeNumberText,
  likes: nonNegativeNumberText,
  comments: nonNegativeNumberText,
  saves: nonNegativeNumberText,
  shares: nonNegativeNumberText,
  videoViews: nonNegativeNumberText,
  profileAccesses: nonNegativeNumberText,
  websiteClicks: nonNegativeNumberText,
  lineAdds: nonNegativeNumberText,
  inquiries: nonNegativeNumberText,
  reservations: nonNegativeNumberText,
  purchases: nonNegativeNumberText,
  salesAmount: nonNegativeNumberText,
  notes: z.string().trim().max(1000).optional()
});

export const analyzeProjectMetricsSchema = z.object({
  projectId: z.string().uuid()
});
