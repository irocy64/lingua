import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { and, eq, inArray, isNull, like, or } from "drizzle-orm";
import { db } from "@/db";
import { cards, decks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SpeakButton } from "@/components/speak-button";
import { AddWordButton } from "@/features/search/add-word-button";

export const metadata = {
  title: "搜词",
};

export const instant = false;

interface SearchResult {
  word: string;
  reading: string | null;
  meaning: string;
  lang: "en" | "ja";
  deckIds: string[];
  score: number;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lang?: string }>;
}) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const { q = "", lang: rawLang } = await searchParams;
  const query = q.trim();
  const lang = rawLang === "en" || rawLang === "ja" ? rawLang : undefined;

  const [deckRows] = await Promise.all([db.select().from(decks)]);
  const deckNames = new Map(deckRows.map((deck) => [deck.id, deck.name]));

  let results: SearchResult[] = [];
  if (query.length > 0) {
    const pattern = `%${query}%`;
    const conditions = [
      isNull(cards.userId),
      or(
        like(cards.word, pattern),
        like(cards.reading, pattern),
        like(cards.meaning, pattern)
      ),
      ...(lang ? [eq(cards.lang, lang)] : []),
    ];

    const rows = await db
      .select({
        word: cards.word,
        reading: cards.reading,
        meaning: cards.meaning,
        lang: cards.lang,
        deckId: cards.deckId,
      })
      .from(cards)
      .where(and(...conditions))
      .limit(300);

    const lower = query.toLowerCase();
    const map = new Map<string, SearchResult>();
    for (const row of rows) {
      const key = `${row.lang}:${row.word.toLowerCase()}`;
      const score =
        row.word.toLowerCase() === lower
          ? 0
          : row.word.toLowerCase().startsWith(lower)
            ? 1
            : row.word.toLowerCase().includes(lower)
              ? 2
              : 3;
      const existing = map.get(key);
      if (existing) {
        if (row.deckId && !existing.deckIds.includes(row.deckId)) {
          existing.deckIds.push(row.deckId);
        }
        existing.score = Math.min(existing.score, score);
      } else {
        map.set(key, {
          word: row.word,
          reading: row.reading,
          meaning: row.meaning ?? "",
          lang: row.lang,
          deckIds: row.deckId ? [row.deckId] : [],
          score,
        });
      }
    }

    results = [...map.values()]
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.word.length - b.word.length ||
          a.word.localeCompare(b.word)
      )
      .slice(0, 60);
  }

  const words = results.map((result) => result.word);
  const ownedRows =
    words.length > 0
      ? await db
          .select({ word: cards.word, lang: cards.lang })
          .from(cards)
          .where(
            and(eq(cards.userId, userId), inArray(cards.word, words))
          )
      : [];
  const owned = new Set(
    ownedRows.map((row) => `${row.lang}:${row.word.toLowerCase()}`)
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">搜词</h1>
      <p className="mt-1 text-sm text-slate-600">
        在 2.3 万内置词条中搜索英文单词、日语假名或中文释义，直接加入生词本。
      </p>

      <form action="/search" className="mt-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="例如 abandon / あい / 放弃"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="lang"
          defaultValue={lang ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">全部语言</option>
          <option value="en">英语</option>
          <option value="ja">日语</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          搜索
        </button>
      </form>

      {query && (
        <p className="mt-4 text-xs text-slate-500">
          找到 {results.length} 个结果
          {results.length === 60 && "（仅显示前 60 个，请输入更精确的关键词）"}
        </p>
      )}

      {!query && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          输入单词、假名或中文释义开始搜索；例如「放弃」「abandon」「あい」。
        </div>
      )}

      {query && results.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          没有找到匹配词条，试试更短的关键词。
        </div>
      )}

      <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {results.map((result) => {
          const key = `${result.lang}:${result.word.toLowerCase()}`;
          const deckLabel = result.deckIds
            .map((id) => deckNames.get(id))
            .filter(Boolean)
            .slice(0, 2)
            .join(" / ");
          return (
            <li
              key={key}
              className="flex items-start justify-between gap-4 px-4 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{result.word}</p>
                  <SpeakButton
                    text={result.word}
                    lang={result.lang}
                    size="sm"
                  />
                </div>
                {result.reading && (
                  <p className="text-xs text-slate-500">{result.reading}</p>
                )}
                <p className="mt-1 text-sm text-slate-700">{result.meaning}</p>
                {deckLabel && (
                  <p className="mt-1 text-xs text-slate-400">{deckLabel}</p>
                )}
              </div>
              <AddWordButton
                word={result.word}
                lang={result.lang}
                reading={result.reading}
                meaning={result.meaning}
                owned={owned.has(key)}
              />
            </li>
          );
        })}
      </ul>

      {results.length > 0 && (
        <p className="mt-4 text-center text-xs text-slate-400">
          加入生词本后可在学习队列中复习；也可
          <Link href="/decks" className="mx-1 underline">
            进入词书
          </Link>
          系统学习。
        </p>
      )}
    </main>
  );
}
