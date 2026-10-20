import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { cards, type Card } from "@/db/schema";

export interface AddCardInput {
  word: string;
  lang: "en" | "ja";
  reading?: string;
  meaning?: string;
}

/** 查找当前用户已存在的同语言词卡片（生词本去重） */
export async function findCard(
  userId: string,
  word: string,
  lang: "en" | "ja"
): Promise<Card | undefined> {
  const rows = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.userId, userId),
        eq(cards.word, word),
        eq(cards.lang, lang)
      )
    );
  return rows[0];
}

/** 加入当前用户的生词本；已存在则直接返回 */
export async function addCard(
  userId: string,
  input: AddCardInput
): Promise<Card> {
  const existing = await findCard(userId, input.word, input.lang);
  if (existing) return existing;

  const id = crypto.randomUUID();
  await db.insert(cards).values({
    id,
    userId,
    word: input.word,
    reading: input.reading ?? null,
    meaning: input.meaning ?? null,
    lang: input.lang,
    state: "new",
  });

  const rows = await db.select().from(cards).where(eq(cards.id, id));
  const created = rows[0];
  if (!created) throw new Error("failed to create card");
  return created;
}

/** 批量查询当前用户已知词（用于阅读时熟悉度着色） */
export async function findKnownWords(
  userId: string,
  words: string[],
  lang: "en" | "ja"
): Promise<Map<string, Card>> {
  const unique = [...new Set(words)];
  if (unique.length === 0) return new Map();

  const rows = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.userId, userId),
        eq(cards.lang, lang),
        inArray(cards.word, unique)
      )
    );

  const result = new Map<string, Card>();
  for (const card of rows) result.set(card.word, card);
  return result;
}

/** 查询内置词书的公共模板词条（供词书详情展示） */
export async function listTemplateCards(deckId?: string) {
  const rows = await db
    .select()
    .from(cards)
    .where(
      deckId
        ? and(isNull(cards.userId), eq(cards.deckId, deckId))
        : isNull(cards.userId)
    );
  return rows;
}
