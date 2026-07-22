type GenerateAiReplyInput = {
  systemPrompt: string;
  userPrompt: string;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

export async function generateAiReply({ systemPrompt, userPrompt }: GenerateAiReplyInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ok: false as const,
      message: "OPENAI_API_KEYが未設定です。"
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_output_tokens: 1800
    })
  });

  const data = (await response.json()) as OpenAiResponse;

  if (!response.ok) {
    return {
      ok: false as const,
      message: createOpenAiErrorMessage(response.status, data.error?.message)
    };
  }

  const outputText =
    data.output_text ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n")
      .trim();

  if (!outputText) {
    return {
      ok: false as const,
      message: "OpenAIから返信本文を取得できませんでした。"
    };
  }

  return {
    ok: true as const,
    text: outputText
  };
}

function createOpenAiErrorMessage(status: number, message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (status === 401) {
    return "OpenAI APIキーが無効、または権限がありません。APIキーを作り直して .env.local に設定してください。";
  }

  if (status === 429 && normalizedMessage.includes("quota")) {
    return "OpenAI APIの利用上限または課金設定により生成できません。OpenAI PlatformのBillingで支払い方法・利用上限・残高を確認してください。";
  }

  if (status === 429) {
    return "OpenAI APIのレート制限に達しました。少し時間を置いて再試行してください。";
  }

  if (status >= 500) {
    return "OpenAI API側で一時的なエラーが発生しています。少し時間を置いて再試行してください。";
  }

  return message ?? `OpenAI API request failed: ${status}`;
}
