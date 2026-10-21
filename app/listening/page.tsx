import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireUser } from "@/lib/access";
import { listeningFeeds, speeches } from "@/lib/feeds";
import { getFeedItems, type FeedItem } from "@/server/feeds";
import { AudioPlayer } from "@/features/listening/audio-player";

export const metadata = {
  title: "听力",
};

export const instant = false;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface FeedSection {
  id: string;
  name: string;
  siteUrl: string;
  items: FeedItem[];
  error?: string;
}

async function PodcastSections() {
  const results = await Promise.allSettled(
    listeningFeeds.map((feed) => getFeedItems(feed))
  );

  const sections: FeedSection[] = listeningFeeds.map((feed, index) => {
    const result = results[index];
    if (result.status === "fulfilled") {
      return {
        id: feed.id,
        name: feed.name,
        siteUrl: feed.siteUrl,
        items: result.value,
      };
    }
    return {
      id: feed.id,
      name: feed.name,
      siteUrl: feed.siteUrl,
      items: [],
      error: (result.reason as Error)?.message ?? "加载失败",
    };
  });

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id}>
          <div className="flex items-baseline justify-between">
            <h3 className="font-medium">{section.name}</h3>
            <a
              href={section.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:underline"
            >
              节目主页
            </a>
          </div>

          {section.error && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              暂时无法加载（{section.error}），稍后刷新再试。
            </p>
          )}
          {!section.error && section.items.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">暂无单集。</p>
          )}

          <div className="mt-2 space-y-3">
            {section.items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-xs text-slate-400">
                    {formatDate(item.publishedAt)}
                    {item.durationSeconds
                      ? ` · ${formatDuration(item.durationSeconds)}`
                      : ""}
                  </p>
                </div>
                {item.summary && (
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">
                    {item.summary}
                  </p>
                )}
                {item.audioUrl && (
                  <div className="mt-3">
                    <AudioPlayer src={item.audioUrl} title={item.title} />
                  </div>
                )}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-slate-400 hover:underline"
                >
                  单集页面
                </a>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PodcastSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-slate-200 p-4"
        >
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-full rounded bg-slate-100" />
          <div className="mt-4 h-9 w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default async function ListeningPage() {
  await connection();
  await requireUser();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="sci-kicker mb-1">AUDIO STREAM</p>
          <h1 className="text-2xl font-bold">听力</h1>
        </div>
        <Link href="/reading" className="text-sm text-slate-500 hover:text-slate-800">
          去外刊阅读 →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        播客与公开演讲。音频来自公开 RSS / 公共领域录音，播放时直接从来源加载。
      </p>

      {/* 精选演讲无需等待 RSS，先渲染 */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">精选演讲（公共领域）</h2>
          <span className="text-xs text-slate-400">历史原声 · 适合精听</span>
        </div>
        <div className="mt-3 space-y-4">
          {speeches.map((speech) => (
            <article
              key={speech.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{speech.title}</h3>
                <p className="text-xs text-slate-500">
                  {speech.speaker} · {speech.year}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-600">{speech.description}</p>
              <div className="mt-3">
                <AudioPlayer src={speech.audioUrl} title={speech.title} />
              </div>
              <a
                href={speech.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-slate-400 hover:underline"
              >
                音频来源 / 许可说明
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* 播客数据流式加载 */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">播客</h2>
          <span className="text-xs text-slate-400">按节目分组 · 每期 8 条</span>
        </div>

        <div className="mt-4">
          <Suspense fallback={<PodcastSkeleton />}>
            <PodcastSections />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
