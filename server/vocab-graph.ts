import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, type Card } from "@/db/schema";

export interface KanjiGroup {
  kanji: string;
  words: Card[];
}

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/g;

/** 提取当前用户日语词汇中的汉字，按汉字聚合形成词汇关联图谱 */
export async function buildKanjiGraph(
  userId: string
): Promise<KanjiGroup[]> {
  const all = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));
  const jaCards = all.filter((c) => c.lang === "ja");

  const groups = new Map<string, Card[]>();

  for (const card of jaCards) {
    const kanjiSet = new Set(card.word.match(KANJI_RE) ?? []);
    for (const kanji of kanjiSet) {
      if (!groups.has(kanji)) groups.set(kanji, []);
      groups.get(kanji)!.push(card);
    }
  }

  return [...groups.entries()]
    .map(([kanji, words]) => ({ kanji, words }))
    .sort((a, b) => b.words.length - a.words.length);
}
