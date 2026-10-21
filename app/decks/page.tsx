import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { decks } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  getDeckTemplateCounts,
  getUserDeckCounts,
} from "@/server/decks";

export const metadata = {
  title: "词书",
};

export const instant = false;

export default async function DecksPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [allDecks, templateCounts, joinedCounts] = await Promise.all([
    db.select().from(decks),
    getDeckTemplateCounts(),
    getUserDeckCounts(userId),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">词书</h1>
      <p className="mt-1 text-sm text-slate-600">
        选择词书开始学习，日语与英语词书独立推进；按需加载，不占用额外空间。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {allDecks.map((deck) => {
          const total = templateCounts.get(deck.id) ?? 0;
          const joined = joinedCounts.get(deck.id) ?? 0;
          return (
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
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>共 {total} 词</span>
                <span>已加入 {joined}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-700"
                  style={{
                    width: `${total > 0 ? Math.min(100, (joined / total) * 100) : 0}%`,
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {allDecks.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          暂无词书，请先运行 <code>npm run db:seed</code>
        </p>
      )}
    </main>
  );
}
