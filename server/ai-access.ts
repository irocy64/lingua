import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { dayKey } from "@/lib/date";

export interface AiAccessResult {
  allowed: boolean;
  status: number;
  message?: string;
}

function numberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * AI 访问控制：
 * 1. 若配置 AI_ALLOWED_EMAILS（逗号分隔），仅白名单邮箱可用；
 * 2. 每人每日次数上限 AI_DAILY_LIMIT_PER_USER；
 * 3. 全站每日次数上限 AI_DAILY_LIMIT_GLOBAL。
 */
export async function checkAiAccess(
  userId: string,
  email: string | null
): Promise<AiAccessResult> {
  const allowedEmails = (process.env.AI_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (
    allowedEmails.length > 0 &&
    !allowedEmails.includes((email ?? "").toLowerCase())
  ) {
    return {
      allowed: false,
      status: 403,
      message: "AI 功能当前仅对白名单账号开放，请联系管理员开通。",
    };
  }

  const perUser = numberEnv("AI_DAILY_LIMIT_PER_USER", 50);
  const global = numberEnv("AI_DAILY_LIMIT_GLOBAL", 300);
  const day = dayKey(new Date());

  const [userRow] = await db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
  if (Number(userRow?.count ?? 0) >= perUser) {
    return {
      allowed: false,
      status: 429,
      message: `今日 AI 次数已用完（每人每日 ${perUser} 次），明天再来。`,
    };
  }

  const [globalRow] = await db
    .select({ total: sql<number>`coalesce(sum(${aiUsage.count}), 0)` })
    .from(aiUsage)
    .where(eq(aiUsage.day, day));
  if (Number(globalRow?.total ?? 0) >= global) {
    return {
      allowed: false,
      status: 429,
      message: "全站 AI 今日额度已用完，明天再来。",
    };
  }

  return { allowed: true, status: 200 };
}

/** 成功生成一次 AI 内容后计数 */
export async function recordAiUsage(userId: string): Promise<void> {
  const day = dayKey(new Date());
  await db
    .insert(aiUsage)
    .values({ id: crypto.randomUUID(), userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
    });
}
