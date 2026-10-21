/**
 * 运维脚本：给指定用户按需补充某个内置词书。
 * 运行：npx tsx scripts/ensure-deck.ts <邮箱> <词书ID> [数量]
 * 例：npx tsx scripts/ensure-deck.ts user@example.com builtin-cet6 300
 */
import { findUserByEmail } from "@/server/account";
import { ensureDeckCards } from "@/server/decks";

async function main() {
  const [email, deckId, limitArg] = process.argv.slice(2);
  if (!email || !deckId) {
    console.error("usage: tsx scripts/ensure-deck.ts <email> <deckId> [limit]");
    process.exit(1);
  }
  const user = await findUserByEmail(email);
  if (!user) {
    console.error("user not found:", email);
    process.exit(1);
  }
  const limit = limitArg ? Number(limitArg) : undefined;
  const added = await ensureDeckCards(user.id, deckId, limit);
  console.log(
    JSON.stringify({ email, deckId, limit: limit ?? "all", added })
  );
}

main();
