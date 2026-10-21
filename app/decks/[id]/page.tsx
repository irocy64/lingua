import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { db } from "@/db";
import { decks, cards } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/access";
import { SpeakButton } from "@/components/speak-button";
import { ensureDeckCards } from "@/server/decks";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deck] = await db.select().from(decks).where(eq(decks.id, id));
  if (!deck) notFound();
  return { title: deck.name };
}

const stateLabel: Record<string, string> = {
  new: "未学",
  learning: "学习中",
  mastered: "已掌握",
  suspended: "暂停",
};

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const user = await requireUser();
  const userId = user.id;
  const { id } = await params;

  const [deck] = await db.select().from(decks).where(eq(decks.id, id));
  if (!deck) notFound();

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(cards)
    .where(and(eq(cards.deckId, id), sql`${cards.userId} is null`));
  const total = Number(totalRow?.count ?? 0);

  const deckCards = await db
    .select()
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.deckId, id)));

  const joined = deckCards.length;
  const mastered = deckCards.filter((c) => c.state === "mastered").length;
  const learning = deckCards.filter((c) => c.state === "learning").length;
  const untouched = total - mastered - learning;
  const startedPct =
    total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;

  async function joinDeck() {
    "use server";
    await ensureDeckCards(userId, id);
    revalidatePath(`/decks/${id}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/decks" className="text-sm text-slate-500 hover:text-slate-800">
        ← 返回词书
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{deck.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {deck.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/study?deck=${deck.id}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            开始学习
          </Link>
          {joined < total && (
            <form action={joinDeck}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {joined === 0 ? `加入全部 ${total} 词` : `补全剩余 ${total - joined} 词`}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-slate-600">
            已加入 {joined} / 共 {total} 词 · 已开始 {mastered + learning}
          </p>
          <p className="text-sm font-semibold text-slate-900">{startedPct}%</p>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${total ? (mastered / total) * 100 : 0}%` }}
            title={`已掌握 ${mastered}`}
          />
          <div
            className="h-full bg-amber-400"
            style={{ width: `${total ? (learning / total) * 100 : 0}%` }}
            title={`学习中 ${learning}`}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>未学 {Math.max(0, untouched)}</span>
          <span className="text-amber-600">学习中 {learning}</span>
          <span className="text-emerald-600">已掌握 {mastered}</span>
        </div>
        {joined < total && (
          <p className="mt-3 text-xs text-slate-400">
            按需加载：开始学习时先加载 300 词；需要整本词书可点“加入全部”。
          </p>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">词汇</th>
              {deck.language === "ja" && (
                <th className="px-4 py-2 font-medium">读音</th>
              )}
              <th className="px-4 py-2 font-medium">释义</th>
              <th className="px-4 py-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {deckCards.slice(0, 80).map((card) => (
              <tr key={card.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{card.word}</span>
                    <SpeakButton text={card.word} lang={card.lang} size="sm" />
                  </div>
                </td>
                {deck.language === "ja" && (
                  <td className="px-4 py-2 text-slate-600">{card.reading}</td>
                )}
                <td className="px-4 py-2 text-slate-700">{card.meaning}</td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {stateLabel[card.state] ?? card.state}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deckCards.length > 80 && (
        <p className="mt-3 text-center text-xs text-slate-400">
          仅展示前 80 个已加入词条，共 {joined} 个
        </p>
      )}

      {joined === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          还没有加入这个词书：点“开始学习”会先加载 300 词，或点“加入全部”整本加入。
        </p>
      )}
    </main>
  );
}
