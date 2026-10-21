/**
 * 种子脚本：把 db/wordlists/*.json 写入内置词书与模板卡片。
 * 幂等：重复执行会更新词书信息，并重建各词书的模板卡片（不影响用户自己的卡片）。
 * 运行：npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { cards, decks } from "./schema";

const INSERT_CHUNK = 300;

interface WordlistCard {
  id: string;
  word: string;
  reading?: string;
  meaning: string;
}

interface WordlistDeck {
  id: string;
  name: string;
  language: "en" | "ja";
  description: string;
  cards: WordlistCard[];
}

async function run() {
  const dir = path.join(process.cwd(), "db", "wordlists");
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  let totalCards = 0;

  for (const file of files) {
    const deck: WordlistDeck = JSON.parse(
      fs.readFileSync(path.join(dir, file), "utf8")
    );

    await db
      .insert(decks)
      .values({
        id: deck.id,
        name: deck.name,
        language: deck.language,
        description: deck.description,
        isBuiltin: true,
      })
      .onConflictDoUpdate({
        target: decks.id,
        set: {
          name: deck.name,
          language: deck.language,
          description: deck.description,
          isBuiltin: true,
        },
      });

    // 重建模板卡片（userId = null）；用户已复制的卡片不受影响
    await db
      .delete(cards)
      .where(and(isNull(cards.userId), eq(cards.deckId, deck.id)));

    for (let i = 0; i < deck.cards.length; i += INSERT_CHUNK) {
      const chunk = deck.cards.slice(i, i + INSERT_CHUNK);
      await db
        .insert(cards)
        .values(
          chunk.map((card) => ({
            id: card.id,
            deckId: deck.id,
            word: card.word,
            reading: card.reading ?? null,
            meaning: card.meaning,
            lang: deck.language,
            state: "new" as const,
          }))
        )
        .onConflictDoNothing();
    }

    totalCards += deck.cards.length;
    console.log(`${deck.id}: ${deck.cards.length} cards (${deck.name})`);
  }

  console.log(
    `Seed completed: ${files.length} decks, ${totalCards} template cards.`
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
