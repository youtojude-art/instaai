import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultOpenAiImageModel, generateAiImage } from "@/lib/ai/images";

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
const originalOpenAiImageModel = process.env.OPENAI_IMAGE_MODEL;
const originalOpenAiImageQuality = process.env.OPENAI_IMAGE_QUALITY;

afterEach(() => {
  vi.restoreAllMocks();
  process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  process.env.OPENAI_IMAGE_MODEL = originalOpenAiImageModel;
  process.env.OPENAI_IMAGE_QUALITY = originalOpenAiImageQuality;
});

describe("generateAiImage", () => {
  it("calls the image generation API with the current default image model", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENAI_IMAGE_MODEL;
    delete process.env.OPENAI_IMAGE_QUALITY;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ b64_json: "abc123" }]
        }),
        { status: 200 }
      )
    );

    const result = await generateAiImage({
      prompt: "投稿画像",
      size: "1024x1024"
    });

    expect(result).toEqual({
      ok: true,
      imageDataUrl: "data:image/png;base64,abc123"
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body).toEqual({
      model: defaultOpenAiImageModel,
      prompt: "投稿画像",
      size: "1024x1024",
      quality: "high",
      output_format: "png",
      n: 1
    });
  });
});
