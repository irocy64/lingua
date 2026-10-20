/**
 * 校验：删除一个用户词条后调用 syncBuiltinCards，应补齐且不重复。
 * 运行：npx tsx scripts/sync-check.ts <邮箱>
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { syncBuiltinCards } from "@/server/account";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("usage: tsx scripts/sync-check.ts <email>");
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error("user not found:", email);
    process.exit(1);
  }

  const count = async () =>
    (await db.select().from(cards).where(eq(cards.userId, user.id))).length;

  const before = await count();
  const [removed] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.userId, user.id), eq(cards.word, "abrupt")));
  if (!removed) {
    console.error("card 'abrupt' not found for user");
    process.exit(1);
  }
  await db.delete(cards).where(eq(cards.id, removed.id));

  const added = await syncBuiltinCards(user.id);
  const after = await count();
  const again = await syncBuiltinCards(user.id);

  console.log(
    JSON.stringify({
      before,
      afterDelete: before - 1,
      added,
      after,
      secondSync: again,
    })
  );
  if (added !== 1 || after !== before || again !== 0) {
    console.error("sync check failed");
    process.exit(1);
  }
  console.log("sync check passed");
}

main();
