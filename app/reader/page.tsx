import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { listTexts } from "@/server/reader";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "阅读",
};

export const instant = false;

export default async function ReaderListPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allTexts = await listTexts(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">阅读</h1>
          <p className="mt-1 text-sm text-slate-600">
            导入你感兴趣的文章，在阅读中积累生词。
          </p>
        </div>
        <Link
          href="/reader/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          导入文本
        </Link>
      </div>

      <div className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {allTexts.map((t) => (
          <Link
            key={t.id}
            href={`/reader/${t.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium">{t.title}</p>
              {t.sourceUrl && (
                <p className="mt-0.5 text-xs text-slate-400">{t.sourceUrl}</p>
              )}
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t.lang === "en" ? "英语" : "日语"}
            </span>
          </Link>
        ))}
        {allTexts.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            暂无阅读材料，点击右上角导入
          </p>
        )}
      </div>
    </main>
  );
}
