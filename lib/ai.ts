import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

/**
 * 统一 AI 接入层（OpenAI 兼容）。
 * 支持任意兼容网关：OpenAI / DeepSeek / 豆包 / 本地 Ollama 等，
 * 通过环境变量配置：
 *   AI_API_KEY   密钥
 *   AI_BASE_URL  接口地址（默认 https://api.openai.com/v1）
 *   AI_MODEL     模型名（默认 gpt-4o-mini）
 */

export const AI_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

export const ai = new OpenAI({
  apiKey: process.env.AI_API_KEY ?? "missing-key",
  baseURL: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
});

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export type ChatMessage = ChatCompletionMessageParam;

export async function chatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number; json?: boolean } = {}
) {
  const completion = await ai.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: options.temperature ?? 0.4,
    response_format: options.json ? { type: "json_object" } : undefined,
  });
  return completion.choices[0]?.message?.content ?? "";
}
