import { z } from "zod";

export const chatImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxChatImageBytes = 2 * 1024 * 1024;

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

export const sendChatMessageSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().trim().max(4000),
  imageDataUrl: optionalTrimmedString,
  imageMimeType: optionalTrimmedString,
  imageName: optionalTrimmedString,
  imageSize: z.preprocess((value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    return Number(value);
  }, z.number().int().positive().max(maxChatImageBytes).optional())
}).superRefine((value, context) => {
  const hasContent = value.content.length > 0;
  const hasImage = Boolean(value.imageDataUrl);

  if (!hasContent && !hasImage) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "メッセージまたは画像を入力してください。",
      path: ["content"]
    });
  }

  if (!hasImage) {
    return;
  }

  if (!value.imageMimeType || !chatImageMimeTypes.includes(value.imageMimeType as (typeof chatImageMimeTypes)[number])) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "画像はJPEG、PNG、WebPを選択してください。",
      path: ["imageMimeType"]
    });
  }

  if (!value.imageSize) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "画像サイズを確認できませんでした。",
      path: ["imageSize"]
    });
  }

  if (value.imageMimeType && !value.imageDataUrl?.startsWith(`data:${value.imageMimeType};base64,`)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "画像データの形式が不正です。",
      path: ["imageDataUrl"]
    });
  }
});
