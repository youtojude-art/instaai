type GenerateImageInput = {
  prompt: string;
  size: "1024x1024" | "1024x1536";
};

type OpenAiImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

export async function generateAiImage({ prompt, size }: GenerateImageInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ok: false as const,
      message: "OPENAI_API_KEYが未設定です。"
    };
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size,
      quality: process.env.OPENAI_IMAGE_QUALITY ?? "high",
      output_format: "png",
      n: 1
    })
  });

  const data = (await response.json()) as OpenAiImageResponse;

  if (!response.ok) {
    return {
      ok: false as const,
      message: createOpenAiImageErrorMessage(response.status, data.error?.message)
    };
  }

  const imageBase64 = data.data?.[0]?.b64_json;
  const imageUrl = data.data?.[0]?.url;

  if (imageBase64) {
    return {
      ok: true as const,
      imageDataUrl: `data:image/png;base64,${imageBase64}`
    };
  }

  if (imageUrl) {
    return {
      ok: true as const,
      imageDataUrl: imageUrl
    };
  }

  return {
    ok: false as const,
    message: "OpenAIから画像データを取得できませんでした。"
  };
}

function createOpenAiImageErrorMessage(status: number, message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (status === 401) {
    return "OpenAI APIキーが無効、または画像生成の権限がありません。";
  }

  if (status === 429 && normalizedMessage.includes("quota")) {
    return "OpenAI APIの利用上限または課金設定により画像生成できません。Billingを確認してください。";
  }

  if (status === 429) {
    return "OpenAI APIのレート制限に達しました。少し時間を置いて再試行してください。";
  }

  if (status >= 500) {
    return "OpenAI API側で一時的なエラーが発生しています。少し時間を置いて再試行してください。";
  }

  return message ?? `OpenAI image request failed: ${status}`;
}
