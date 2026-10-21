import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";

const INSERT_CHUNK = 300;

interface TemplateCard {
  id: string;
  word: string;
  reading: string | null;
  meaning: string | null;
  aiNote: string | null;
  lang: "en" | "ja";
}

/** 把内置词书模板按需复制到用户词库；limit 为本次最多复制多少词 */
export async function ensureDeckCards(
  userId: string,
  deckId: string,
  limit?: number
): Promise<number> {
  const templates: TemplateCard[] = await db
    .select({
      id: cards.id,
      word: cards.word,
      reading: cards.reading,
      meaning: cards.meaning,
      aiNote: cards.aiNote,
      lang: cards.lang,
    })
    .from(cards)
    .where(and(isNull(cards.userId), eq(cards.deckId, deckId)))
    .orderBy(
      limit
        ? sql`case when ${cards.aiNote} is not null then 0 else 1 end, random()`
        : cards.id
    );

  if (templates.length === 0) return 0;

  const owned = await db
    .select({ word: cards.word })
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.deckId, deckId)));
  const ownedWords = new Set(owned.map((row) => row.word));

  const seen = new Set<string>();
  let missing = templates.filter((t) => {
    if (ownedWords.has(t.word) || seen.has(t.word)) return false;
    seen.add(t.word);
    return true;
  });

  if (limit && missing.length > limit) {
    missing = missing.slice(0, limit);
  }
  if (missing.length === 0) return 0;

  for (let i = 0; i < missing.length; i += INSERT_CHUNK) {
    const chunk = missing.slice(i, i + INSERT_CHUNK);
    await db
      .insert(cards)
      .values(
        chunk.map((t) => ({
          id: crypto.randomUUID(),
          userId,
          deckId,
          word: t.word,
          reading: t.reading,
          meaning: t.meaning,
          aiNote: t.aiNote,
          lang: t.lang,
          state: "new" as const,
        }))
      )
      .onConflictDoNothing();
  }

  return missing.length;
}

/** 同步用户已加入的词书（补全模板新增词），并保证默认 CET-6 词书存在 */
export async function syncJoinedDeckCards(userId: string): Promise<number> {
  const joined = await db
    .selectDistinct({ deckId: cards.deckId })
    .from(cards)
    .where(eq(cards.userId, userId));

  const deckIds = new Set(
    joined.map((row) => row.deckId).filter((id): id is string => Boolean(id))
  );
  deckIds.add("builtin-cet6");

  let added = 0;
  for (const deckId of deckIds) {
    added += await ensureDeckCards(userId, deckId);
  }
  return added;
}

/** 每个内置词书的模板词数 */
export async function getDeckTemplateCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      deckId: cards.deckId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(cards)
    .where(isNull(cards.userId))
    .groupBy(cards.deckId);

  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.deckId) map.set(row.deckId, Number(row.count));
  }
  return map;
}

/** 用户已加入每个词书的词数 */
export async function getUserDeckCounts(
  userId: string
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      deckId: cards.deckId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(cards)
    .where(eq(cards.userId, userId))
    .groupBy(cards.deckId);

  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.deckId) map.set(row.deckId, Number(row.count));
  }
  return map;
}

/** 读取词书元数据（用于校验词书存在与语言） */
export async function getDeck(deckId: string) {
  const rows = await db.select().from(decks).where(eq(decks.id, deckId));
  return rows[0];
}
