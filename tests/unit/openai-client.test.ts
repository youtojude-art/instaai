import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultOpenAiModel, generateAiReply } from "@/lib/ai/openai";

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
const originalOpenAiModel = process.env.OPENAI_MODEL;

afterEach(() => {
  vi.restoreAllMocks();
  process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  process.env.OPENAI_MODEL = originalOpenAiModel;
});

describe("generateAiReply", () => {
  it("calls the Responses API with the current default model and instructions", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENAI_MODEL;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: "返信本文"
        }),
        { status: 200 }
      )
    );

    const result = await generateAiReply({
      systemPrompt: "システム指示",
      userPrompt: "ユーザー指示"
    });

    expect(result).toEqual({ ok: true, text: "返信本文" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        }
      })
    );

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body).toMatchObject({
      model: defaultOpenAiModel,
      instructions: "システム指示",
      reasoning: {
        effort: "low"
      },
      input: [
        {
          role: "user",
          content: "ユーザー指示"
        }
      ],
      max_output_tokens: 1800
    });
  });

  it("sends image input and a structured text format when provided", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "custom-model";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              content: [{ type: "output_text", text: "{\"tasks\":[]}" }]
            }
          ]
        }),
        { status: 200 }
      )
    );

    await generateAiReply({
      systemPrompt: "JSONで返す",
      userPrompt: "画像を見て",
      imageDataUrl: "data:image/png;base64,abc",
      reasoningEffort: "medium",
      textFormat: {
        type: "json_schema",
        name: "task_schema",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["tasks"],
          properties: {
            tasks: {
              type: "array"
            }
          }
        }
      }
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body.model).toBe("custom-model");
    expect(body.reasoning.effort).toBe("medium");
    expect(body.input[0].content).toEqual([
      {
        type: "input_text",
        text: "画像を見て"
      },
      {
        type: "input_image",
        image_url: "data:image/png;base64,abc",
        detail: "auto"
      }
    ]);
    expect(body.text.format).toMatchObject({
      type: "json_schema",
      name: "task_schema",
      strict: true
    });
  });
});
