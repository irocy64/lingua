/**
 * 统一 AI 接入层（OpenAI 兼容）。
 * 支持任意兼容网关：OpenAI / DeepSeek / 豆包 / 本地 Ollama 等，
 * 通过环境变量配置：
 *   AI_API_KEY   密钥
 *   AI_BASE_URL  接口地址（默认 https://api.openai.com/v1）
 *   AI_MODEL     模型名（默认 gpt-4o-mini）
 */

export const AI_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number; json?: boolean } = {}
) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI 未配置：缺少 AI_API_KEY");

  const base = (
    process.env.AI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/+$/, "");

  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: options.temperature ?? 0.4,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI 请求失败 ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}
