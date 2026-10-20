/**
 * 种子脚本：写入内置词书与示例卡片（幂等，重复执行不会产生重复数据）
 * 运行：npm run db:seed
 * 对 Turso 远程库同样适用（DATABASE_URL 指向 libsql://... 并设置 DATABASE_AUTH_TOKEN）
 */
import { db } from "./index";
import { decks, cards } from "./schema";
import { seedDecks } from "./seed-data";

async function run() {
  for (const deck of seedDecks) {
    await db
      .insert(decks)
      .values({
        id: deck.id,
        name: deck.name,
        language: deck.language,
        description: deck.description,
        isBuiltin: true,
      })
      .onConflictDoNothing();

    for (const card of deck.cards) {
      await db
        .insert(cards)
        .values({
          id: card.id,
          deckId: deck.id,
          word: card.word,
          reading: card.reading ?? null,
          meaning: card.meaning,
          example: card.example ?? null,
          exampleTranslation: card.exampleTranslation ?? null,
          lang: deck.language,
          state: "new",
        })
        .onConflictDoNothing();
    }
  }

  const allDecks = await db.select().from(decks);
  const allCards = await db.select().from(cards);
  console.log(`Seed completed: ${allDecks.length} decks, ${allCards.length} cards.`);
}

run();
