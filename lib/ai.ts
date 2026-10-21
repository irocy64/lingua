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

let client: OpenAI | null = null;

/** 惰性创建客户端：未配置 key 时不会在构建/启动阶段报错 */
function getClient(): OpenAI {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI 未配置：缺少 AI_API_KEY");
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    });
  }
  return client;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export type ChatMessage = ChatCompletionMessageParam;

export async function chatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number; json?: boolean } = {}
) {
  const completion = await getClient().chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: options.temperature ?? 0.4,
    response_format: options.json ? { type: "json_object" } : undefined,
  });
  return completion.choices[0]?.message?.content ?? "";
}
