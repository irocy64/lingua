import { and, asc, eq, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, reviews, type Card } from "@/db/schema";
import { isMastered, scheduleCard, type Grade } from "@/lib/srs";
import { ensureDeckCards } from "@/server/decks";
import {
  getDailyTargets,
  getTodayCounts,
  type DailyTargets,
  type TodayCounts,
} from "@/server/stats";

export interface StudyQueue {
  newCards: Card[];
  dueCards: Card[];
  /** 今日剩余额度（已扣除今日已完成的部分） */
  remaining: { newCards: number; reviews: number };
  targets: DailyTargets;
  today: TodayCounts;
}

/** 获取当前用户的今日学习队列：未学新词 + 到期需复习卡片（受每日目标约束） */
export async function getStudyQueue(
  userId: string,
  deckId?: string
): Promise<StudyQueue> {
  const [targets, today] = await Promise.all([
    getDailyTargets(userId),
    getTodayCounts(userId),
  ]);

  const newRemaining = Math.max(0, targets.dailyNewTarget - today.newLearned);
  const reviewRemaining = Math.max(
    0,
    targets.dailyReviewTarget - today.reviewed
  );

  // 新词不足时按需补充一批（避免把上万词一次复制给每个用户）
  const [ownedNewRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(cards)
    .where(
      and(
        eq(cards.userId, userId),
        eq(cards.state, "new"),
        ...(deckId ? [eq(cards.deckId, deckId)] : [])
      )
    );
  if (Number(ownedNewRow?.count ?? 0) < targets.dailyNewTarget) {
    await ensureDeckCards(userId, deckId ?? "builtin-cet6", 300);
  }

  const newCards: Card[] =
    newRemaining === 0
      ? []
      : await db
          .select()
          .from(cards)
          .where(
            and(
              eq(cards.userId, userId),
              eq(cards.state, "new"),
              ...(deckId ? [eq(cards.deckId, deckId)] : [])
            )
          )
          .limit(newRemaining);

  const dueCards: Card[] =
    reviewRemaining === 0
      ? []
      : await db
          .select()
          .from(cards)
          .where(
            and(
              eq(cards.userId, userId),
              ne(cards.state, "new"),
              ne(cards.state, "suspended"),
              lte(cards.dueAt, new Date()),
              ...(deckId ? [eq(cards.deckId, deckId)] : [])
            )
          )
          .orderBy(asc(cards.dueAt))
          .limit(reviewRemaining);

  return {
    newCards,
    dueCards,
    remaining: { newCards: newRemaining, reviews: reviewRemaining },
    targets,
    today,
  };
}

/** 提交当前用户的一次复习评分，执行 FSRS 调度并落库 */
export async function submitReview(
  userId: string,
  cardId: string,
  grade: Grade
) {
  const cardRows = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
  const card = cardRows[0];
  if (!card) throw new Error("card not found");

  const wasNew = card.state === "new";
  const result = scheduleCard(card.fsrsData, grade);

  const nextState = isMastered(result.fsrsData)
    ? "mastered"
    : ("learning" as const);

  await db
    .update(cards)
    .set({
      fsrsData: result.fsrsData,
      dueAt: result.dueAt,
      state: nextState,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, cardId));

  await db.insert(reviews).values({
    id: crypto.randomUUID(),
    cardId,
    userId,
    rating: grade,
    elapsedDays: result.elapsedDays,
    wasNew,
    reviewedAt: new Date(),
  });

  return {
    cardId,
    dueAt: result.dueAt,
    state: nextState,
    reps: result.reps,
    wasNew,
  };
}
