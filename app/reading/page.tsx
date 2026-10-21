import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireUser } from "@/lib/access";
import { readingFeeds } from "@/lib/feeds";
import { bingSearchUrl, bingTranslateUrl } from "@/lib/search-links";
import { getFeedItems, type FeedItem } from "@/server/feeds";
import { createText } from "@/server/reader";
import { SpeakButton } from "@/components/speak-button";

export const metadata = {
  title: "外刊阅读",
};

export const instant = false;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function importArticle(formData: FormData) {
  "use server";
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").slice(0, 200);
  const content = String(formData.get("content") ?? "").slice(0, 20000);
  const sourceUrl = String(formData.get("sourceUrl") ?? "").slice(0, 1000);
  const rawLang = String(formData.get("lang") ?? "en");
  const lang = rawLang === "ja" ? "ja" : "en";
  if (!title || !content) return;
  const text = await createText(user.id, {
    title,
    content,
    lang,
    sourceUrl: sourceUrl || undefined,
  });
  redirect(`/reader/${text.id}`);
}

interface FeedSection {
  id: string;
  name: string;
  description: string;
  siteUrl: string;
  lang: "en" | "ja";
  items: FeedItem[];
  error?: string;
}

async function ReadingFeeds() {
  const results = await Promise.allSettled(
    readingFeeds.map((feed) => getFeedItems(feed))
  );

  const sections: FeedSection[] = readingFeeds.map((feed, index) => {
    const result = results[index];
    if (result.status === "fulfilled") {
      return {
        id: feed.id,
        name: feed.name,
        description: feed.description,
        siteUrl: feed.siteUrl,
        lang: feed.lang,
        items: result.value,
      };
    }
    return {
      id: feed.id,
      name: feed.name,
      description: feed.description,
      siteUrl: feed.siteUrl,
      lang: feed.lang,
      items: [],
      error: (result.reason as Error)?.message ?? "加载失败",
    };
  });

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                {section.name}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {section.lang === "en" ? "英语" : "日语"}
                </span>
                {section.id === "cgtn-world" && (
                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    国内可直连
                  </span>
                )}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{section.description}</p>
            </div>
            <a
              href={section.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:underline"
            >
              访问原站
            </a>
          </div>

          {section.error && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              暂时无法加载（{section.error}），稍后刷新再试。
            </p>
          )}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium leading-snug hover:underline"
                  >
                    {item.title}
                  </a>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
                {item.summary && (
                  <div className="mt-2 flex items-start gap-2">
                    <p className="line-clamp-4 flex-1 text-sm text-slate-600">
                      {item.summary}
                    </p>
                    <SpeakButton
                      text={item.summary}
                      lang={item.lang}
                      rate={0.95}
                      size="sm"
                    />
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:underline"
                  >
                    阅读原文
                  </a>
                  <a
                    href={bingSearchUrl(`${item.title} ${item.sourceName}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:underline"
                    title="无需 VPN 的 Bing 搜索"
                  >
                    Bing 搜原文
                  </a>
                  <a
                    href={bingTranslateUrl(item.summary || item.title, item.lang)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:underline"
                  >
                    Bing 翻译
                  </a>
                  <form action={importArticle} className="ml-auto">
                    <input type="hidden" name="title" value={item.title} />
                    <input
                      type="hidden"
                      name="content"
                      value={`${item.title}\n\n${item.summary}`}
                    />
                    <input type="hidden" name="lang" value={item.lang} />
                    <input type="hidden" name="sourceUrl" value={item.link} />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      导入精读
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-slate-200 p-4"
        >
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default async function ReadingPage() {
  await connection();
  await requireUser();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">外刊阅读</h1>
        <Link href="/listening" className="text-sm text-slate-500 hover:text-slate-800">
          去听力 →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        BBC、卫报、CGTN、Japan Times、NHK 每日更新。原文打不开时可用「Bing
        搜原文」；点「导入精读」会把摘要加入阅读器。
      </p>

      <form
        action="https://cn.bing.com/search"
        method="GET"
        target="_blank"
        className="mt-4 flex gap-2"
      >
        <input
          name="q"
          placeholder="用 Bing 搜索文章标题 / 主题（国内可直连）"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Bing 搜索
        </button>
      </form>

      <div className="mt-8">
        <Suspense fallback={<FeedSkeleton />}>
          <ReadingFeeds />
        </Suspense>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        内容版权归原媒体所有；本站仅展示 RSS 摘要并链接原文。
      </p>
    </main>
  );
}
