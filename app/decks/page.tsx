import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { decks, cards } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "词书",
};

export const instant = false;

export default async function DecksPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const allDecks = await db.select().from(decks);

  const decksWithCount = await Promise.all(
    allDecks.map(async (deck) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(cards)
        .where(and(eq(cards.userId, userId), eq(cards.deckId, deck.id)));
      return { ...deck, cardCount: Number(row?.count ?? 0) };
    })
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">词书</h1>
      <p className="mt-1 text-sm text-slate-600">
        选择词书开始学习，日语与英语词书独立推进。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {decksWithCount.map((deck) => (
          <Link
            key={deck.id}
            href={`/decks/${deck.id}`}
            className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{deck.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {deck.language === "en" ? "英语" : "日语"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{deck.description}</p>
            <p className="mt-3 text-xs text-slate-500">
              我的词库 {deck.cardCount} 个词条
            </p>
          </Link>
        ))}
      </div>

      {decksWithCount.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          暂无词书，请先运行 <code>npm run db:seed</code>
        </p>
      )}
    </main>
  );
}
