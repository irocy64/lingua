import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, reviews, users } from "@/db/schema";
import { addDays, dayKey, startOfDay } from "@/lib/date";

export interface TodayCounts {
  /** 今日新学（首次学习的卡片）次数 */
  newLearned: number;
  /** 今日复习（非首次）次数 */
  reviewed: number;
  /** 今日评分总数 */
  total: number;
}

export interface DailyTargets {
  dailyNewTarget: number;
  dailyReviewTarget: number;
}

export interface DashboardSummary extends DailyTargets, TodayCounts {
  newCount: number;
  dueCount: number;
  learningCount: number;
  masteredCount: number;
  streakDays: number;
  last30Days: { date: string; count: number }[];
}

/** 读取用户的每日目标（用户不存在时回退默认值） */
export async function getDailyTargets(userId: string): Promise<DailyTargets> {
  const rows = await db
    .select({
      dailyNewTarget: users.dailyNewTarget,
      dailyReviewTarget: users.dailyReviewTarget,
    })
    .from(users)
    .where(eq(users.id, userId));
  return {
    dailyNewTarget: rows[0]?.dailyNewTarget ?? 15,
    dailyReviewTarget: rows[0]?.dailyReviewTarget ?? 100,
  };
}

/** 统计当前用户“今天”（本地时区）的评分情况 */
export async function getTodayCounts(userId: string): Promise<TodayCounts> {
  const rows = await db
    .select({ wasNew: reviews.wasNew })
    .from(reviews)
    .where(
      and(eq(reviews.userId, userId), gte(reviews.reviewedAt, startOfDay()))
    );

  let newLearned = 0;
  let reviewed = 0;
  for (const row of rows) {
    if (row.wasNew) newLearned += 1;
    else reviewed += 1;
  }
  return { newLearned, reviewed, total: rows.length };
}

export async function getDashboardSummary(
  userId: string
): Promise<DashboardSummary> {
  const now = new Date();

  const [newRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.state, "new")));
  const [dueRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(cards)
    .where(
      and(
        eq(cards.userId, userId),
        ne(cards.state, "new"),
        ne(cards.state, "suspended"),
        lte(cards.dueAt, now)
      )
    );
  const [learningRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.state, "learning")));
  const [masteredRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.state, "mastered")));

  const newCount = Number(newRow?.count ?? 0);
  const dueCount = Number(dueRow?.count ?? 0);
  const learningCount = Number(learningRow?.count ?? 0);
  const masteredCount = Number(masteredRow?.count ?? 0);

  // 近 60 天复习记录（仅当前用户），按本地日期聚合
  const since = addDays(startOfDay(now), -59);

  const recentReviews = await db
    .select({ reviewedAt: reviews.reviewedAt })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), gte(reviews.reviewedAt, since)));

  const countByDay = new Map<string, number>();
  for (const r of recentReviews) {
    const key = dayKey(r.reviewedAt);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  let streakDays = 0;
  const cursor = new Date(now);
  if (!countByDay.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (countByDay.has(dayKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const last30Days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(now, -i);
    const key = dayKey(d);
    last30Days.push({ date: key, count: countByDay.get(key) ?? 0 });
  }

  const [targets, today] = await Promise.all([
    getDailyTargets(userId),
    getTodayCounts(userId),
  ]);

  return {
    newCount,
    dueCount,
    learningCount,
    masteredCount,
    streakDays,
    last30Days,
    ...targets,
    ...today,
  };
}
