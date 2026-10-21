/**
 * 预生成 AI 例句/助记，写入模板或指定用户的卡片。
 *
 * 用法：
 *   npx tsx scripts/pregen-ai-notes.ts --deck builtin-cet6 --limit 300
 *   npx tsx scripts/pregen-ai-notes.ts --user 1245411039@qq.com --limit 400
 *
 * 需要环境变量：DATABASE_URL、DATABASE_AUTH_TOKEN、AI_API_KEY、AI_BASE_URL、AI_MODEL
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { generateVocabNote } from "@/server/ai-tutor";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const deckId = arg("deck");
  const email = arg("user");
  const limit = Number(arg("limit") ?? 300);
  const concurrency = Math.max(1, Number(arg("concurrency") ?? 4));

  if (!deckId && !email) {
    console.error("请提供 --deck <id> 或 --user <email>");
    process.exit(1);
  }
  if (!process.env.AI_API_KEY) {
    console.error("缺少 AI_API_KEY");
    process.exit(1);
  }

  const conditions = [isNull(cards.aiNote)];
  if (deckId) {
    conditions.push(isNull(cards.userId), eq(cards.deckId, deckId));
  } else {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email!.trim().toLowerCase()));
    if (!user) {
      console.error("用户不存在:", email);
      process.exit(1);
    }
    conditions.push(eq(cards.userId, user.id));
  }

  const rows = await db
    .select({
      id: cards.id,
      word: cards.word,
      lang: cards.lang,
      meaning: cards.meaning,
      reading: cards.reading,
    })
    .from(cards)
    .where(and(...conditions))
    .orderBy(sql`random()`)
    .limit(limit);

  console.log(`待生成 ${rows.length} 条（concurrency=${concurrency}）`);

  let cursor = 0;
  let done = 0;
  let failed = 0;

  async function worker() {
    while (cursor < rows.length) {
      const card = rows[cursor++];
      try {
        const note = await generateVocabNote(
          card.word,
          card.lang,
          card.meaning,
          card.reading
        );
        await db
          .update(cards)
          .set({ aiNote: JSON.stringify(note) })
          .where(eq(cards.id, card.id));
        done += 1;
        if (done % 10 === 0) console.log(`进度 ${done}/${rows.length}`);
      } catch (error) {
        failed += 1;
        console.error("失败:", card.word, (error as Error).message);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, rows.length) }, () => worker())
  );

  console.log(`完成：成功 ${done}，失败 ${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
