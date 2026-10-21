import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireUser } from "@/lib/access";
import { readingFeeds } from "@/lib/feeds";
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

interface FeedSection {
  id: string;
  name: string;
  description: string;
  siteUrl: string;
  lang: "en" | "ja";
  items: FeedItem[];
  error?: string;
}

export default async function ReadingPage() {
  await connection();
  const user = await requireUser();

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

  async function importArticle(formData: FormData) {
    "use server";
    await requireUser();
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">外刊阅读</h1>
        <Link href="/listening" className="text-sm text-slate-500 hover:text-slate-800">
          去听力 →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        BBC、卫报、Japan Times、NHK 每日更新。点「导入精读」会把 RSS
        摘要加入你的阅读器，可点词查词、加入生词本。
      </p>

      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {section.name}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {section.lang === "en" ? "英语" : "日语"}
                  </span>
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
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:underline"
                    >
                      阅读原文
                    </a>
                    <form action={importArticle}>
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

      <p className="mt-8 text-center text-xs text-slate-400">
        内容版权归原媒体所有；本站仅展示 RSS 摘要并链接原文。
      </p>
    </main>
  );
}
