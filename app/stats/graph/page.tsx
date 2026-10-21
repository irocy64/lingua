import { connection } from "next/server";
import { buildKanjiGraph } from "@/server/vocab-graph";
import { requireUser } from "@/lib/access";

export const metadata = { title: "词汇图谱" };
export const instant = false;

export default async function VocabGraphPage() {
  await connection();
  const user = await requireUser();
  const groups = await buildKanjiGraph(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">词汇图谱</h1>
      <p className="mt-1 text-sm text-slate-600">
        按汉字聚合日语词汇，看到一个汉字如何串联多个词。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.kanji} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl font-bold text-white">
                {g.kanji}
              </span>
              <span className="text-xs text-slate-400">
                关联 {g.words.length} 个词
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {g.words.map((w) => (
                <li key={w.id} className="text-sm">
                  <span className="font-medium">{w.word}</span>
                  {w.reading && (
                    <span className="ml-2 text-xs text-slate-400">{w.reading}</span>
                  )}
                  {w.meaning && (
                    <span className="ml-2 text-xs text-slate-500">{w.meaning}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          暂无日语词汇，加入含汉字的日语词后这里会显示关联
        </p>
      )}
    </main>
  );
}
