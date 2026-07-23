import { describe, expect, it } from "vitest";
import { maxChatImageBytes, sendChatMessageSchema } from "@/lib/validations/chat";

const projectId = "11111111-1111-4111-8111-111111111111";

describe("sendChatMessageSchema", () => {
  it("accepts a text message", () => {
    const result = sendChatMessageSchema.safeParse({
      projectId,
      content: "投稿案を作ってください。"
    });

    expect(result.success).toBe(true);
  });

  it("accepts an image-only message", () => {
    const result = sendChatMessageSchema.safeParse({
      projectId,
      content: "",
      imageDataUrl: "data:image/png;base64,AAAA",
      imageMimeType: "image/png",
      imageName: "sample.png",
      imageSize: "1200"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported image types", () => {
    const result = sendChatMessageSchema.safeParse({
      projectId,
      content: "見てください。",
      imageDataUrl: "data:image/gif;base64,AAAA",
      imageMimeType: "image/gif",
      imageName: "sample.gif",
      imageSize: "1200"
    });

    expect(result.success).toBe(false);
  });

  it("rejects oversized images", () => {
    const result = sendChatMessageSchema.safeParse({
      projectId,
      content: "見てください。",
      imageDataUrl: "data:image/jpeg;base64,AAAA",
      imageMimeType: "image/jpeg",
      imageName: "large.jpg",
      imageSize: String(maxChatImageBytes + 1)
    });

    expect(result.success).toBe(false);
  });
});
