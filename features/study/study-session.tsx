"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "@/db/schema";
import { SpeakButton } from "@/components/speak-button";

type Grade = "again" | "hard" | "good" | "easy";

interface QueueItem {
  card: Card;
  isNew: boolean;
  /** 本会话内答错后回炉重学 */
  relearn?: boolean;
}

interface SessionStats {
  newLearned: number;
  reviewed: number;
  again: number;
}

interface QueueMeta {
  targets: { dailyNewTarget: number; dailyReviewTarget: number };
  today: { newLearned: number; reviewed: number; total: number };
}

interface QueueData extends QueueMeta {
  newCards: Card[];
  dueCards: Card[];
}

interface VocabNote {
  example: string;
  translation: string;
  mnemonic: string;
}

const emptyStats: SessionStats = { newLearned: 0, reviewed: 0, again: 0 };

const gradeButtons: {
  grade: Grade;
  label: string;
  hint: string;
  className: string;
}[] = [
  {
    grade: "again",
    label: "重来",
    hint: "1",
    className: "bg-rose-600 hover:bg-rose-500",
  },
  {
    grade: "hard",
    label: "困难",
    hint: "2",
    className: "bg-amber-500 hover:bg-amber-400",
  },
  {
    grade: "good",
    label: "一般",
    hint: "3",
    className: "bg-emerald-600 hover:bg-emerald-500",
  },
  {
    grade: "easy",
    label: "简单",
    hint: "4",
    className: "bg-sky-600 hover:bg-sky-500",
  },
];

export function StudySession({
  deck,
  decks = [],
}: {
  deck?: string;
  decks?: { id: string; name: string; language: string }[];
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<SessionStats>(emptyStats);
  const [meta, setMeta] = useState<QueueMeta | null>(null);
  const [aiNotes, setAiNotes] = useState<Record<string, VocabNote>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<{ id: string; message: string } | null>(
    null
  );
  const requeuedRef = useRef<Set<string>>(new Set());

  const applyQueue = useCallback((data: QueueData) => {
    requeuedRef.current = new Set();
    // 先复习到期卡片，再学新词，符合间隔重复的优先顺序
    const items: QueueItem[] = [
      ...data.dueCards.map((card) => ({ card, isNew: false })),
      ...data.newCards.map((card) => ({ card, isNew: true })),
    ];
    setQueue(items);
    setIndex(0);
    setFlipped(false);
    setStats(emptyStats);
    setMeta({ targets: data.targets, today: data.today });
  }, []);

  const fetchQueue = useCallback(async (): Promise<QueueData> => {
    const query = deck ? `?deck=${encodeURIComponent(deck)}` : "";
    const res = await fetch(`/api/study/queue${query}`);
    if (!res.ok) throw new Error("queue request failed");
    return (await res.json()) as QueueData;
  }, [deck]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      applyQueue(await fetchQueue());
    } catch {
      setError("队列加载失败，请检查网络后重试。");
    } finally {
      setLoading(false);
    }
  }, [fetchQueue, applyQueue]);

  useEffect(() => {
    let cancelled = false;
    fetchQueue()
      .then((data) => {
        if (cancelled) return;
        applyQueue(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("队列加载失败，请检查网络后重试。");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchQueue, applyQueue]);

  const current = queue[index];
  const aiNote = current ? aiNotes[current.card.id] : undefined;

  const submit = useCallback(
    async (grade: Grade) => {
      if (!current || submitting) return;
      setSubmitting(true);
      setError("");
      try {
        const res = await fetch("/api/study/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: current.card.id, grade }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "提交失败");
        }
        setStats((prev) => ({
          newLearned: prev.newLearned + (current.isNew ? 1 : 0),
          reviewed: prev.reviewed + (current.isNew ? 0 : 1),
          again: prev.again + (grade === "again" ? 1 : 0),
        }));
        // 答错的词在本次会话末尾再出现一次，形成短时记忆强化
        if (grade === "again" && !requeuedRef.current.has(current.card.id)) {
          requeuedRef.current.add(current.card.id);
          setQueue((prev) => [
            ...prev,
            { card: current.card, isNew: false, relearn: true },
          ]);
        }
        setFlipped(false);
        setIndex((i) => i + 1);
      } catch (e) {
        setError(`提交失败：${(e as Error).message}`);
      } finally {
        setSubmitting(false);
      }
    },
    [current, submitting]
  );

  const loadAiNote = useCallback(async () => {
    if (!current) return;
    const id = current.card.id;
    setAiLoadingId(id);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      setAiNotes((prev) => ({ ...prev, [id]: data.note as VocabNote }));
    } catch (e) {
      setAiError({ id, message: (e as Error).message });
    } finally {
      setAiLoadingId(null);
    }
  }, [current]);

  // 键盘快捷键：空格/回车翻面，1-4 评分
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || loading || submitting) {
        return;
      }
      if (!current) {
        if (event.key === "Enter") {
          event.preventDefault();
          loadQueue();
        }
        return;
      }
      if (!flipped) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setFlipped(true);
        }
        return;
      }
      const map: Record<string, Grade> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };
      const grade = map[event.key];
      if (grade) {
        event.preventDefault();
        submit(grade);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, flipped, loading, submitting, submit, loadQueue]);

  if (loading) {
    return <p className="py-20 text-center text-slate-500">加载中…</p>;
  }

  if (error && queue.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-rose-600">{error}</p>
        <button
          onClick={loadQueue}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!current) {
    const liveNew = (meta?.today.newLearned ?? 0) + stats.newLearned;
    const liveReviewed = (meta?.today.reviewed ?? 0) + stats.reviewed;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 text-2xl font-bold">今天的学习任务已完成</h2>
        <p className="mt-2 text-sm text-slate-600">
          本次处理 {stats.newLearned + stats.reviewed} 张卡片
          {stats.again > 0 && `，其中 ${stats.again} 张需要重来`}
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">今日新学</p>
            <p className="mt-1 text-2xl font-bold">
              {liveNew}
              <span className="ml-1 text-sm font-normal text-slate-400">
                / {meta?.targets.dailyNewTarget ?? 15}
              </span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">今日复习</p>
            <p className="mt-1 text-2xl font-bold">
              {liveReviewed}
              <span className="ml-1 text-sm font-normal text-slate-400">
                / {meta?.targets.dailyReviewTarget ?? 100}
              </span>
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={loadQueue}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            再学一组（Enter）
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            返回仪表盘
          </Link>
        </div>
      </div>
    );
  }

  const liveNew = (meta?.today.newLearned ?? 0) + stats.newLearned;
  const liveReviewed = (meta?.today.reviewed ?? 0) + stats.reviewed;
  const progress = queue.length > 0 ? (index / queue.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <select
          value={deck ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            router.push(
              value ? `/study?deck=${encodeURIComponent(value)}` : "/study"
            );
          }}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">全部词书（默认 CET-6 起步）</option>
          {decks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Link
          href="/decks"
          className="shrink-0 text-xs text-slate-500 hover:text-slate-800"
        >
          管理词书
        </Link>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          新学 {liveNew}/{meta?.targets.dailyNewTarget ?? 15} · 复习{" "}
          {liveReviewed}/{meta?.targets.dailyReviewTarget ?? 100}
        </span>
        <Link href="/dashboard" className="hover:text-slate-800">
          结束学习
        </Link>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-4 text-center text-sm text-slate-500">
        {index + 1} / {queue.length}
        {current.relearn ? (
          <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
            回炉重学
          </span>
        ) : current.isNew ? (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
            新词
          </span>
        ) : (
          <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
            复习
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <p className="text-4xl font-bold">{current.card.word}</p>
            <SpeakButton
              text={current.card.word}
              lang={current.card.lang}
              size="lg"
            />
          </div>
          {current.card.reading && (
            <p className="mt-2 text-lg text-slate-500">{current.card.reading}</p>
          )}
        </div>

        {flipped && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-lg">{current.card.meaning}</p>
            {current.card.example && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <p className="flex-1">{current.card.example}</p>
                  <SpeakButton
                    text={current.card.example}
                    lang={current.card.lang}
                    rate={0.9}
                    size="sm"
                  />
                </div>
                {current.card.exampleTranslation && (
                  <p className="mt-1 text-slate-500">
                    {current.card.exampleTranslation}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">
                  ✨ AI 例句 / 助记
                </p>
                <button
                  type="button"
                  onClick={loadAiNote}
                  disabled={aiLoadingId === current.card.id}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {aiLoadingId === current.card.id
                    ? "生成中…"
                    : aiNote
                      ? "重新生成"
                      : "生成"}
                </button>
              </div>
              {aiError?.id === current.card.id && (
                <p className="mt-2 text-xs text-rose-600">{aiError.message}</p>
              )}
              {aiNote && (
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-start gap-2">
                    <p className="flex-1">{aiNote.example}</p>
                    <SpeakButton
                      text={aiNote.example}
                      lang={current.card.lang}
                      rate={0.9}
                      size="sm"
                    />
                  </div>
                  <p className="text-slate-500">{aiNote.translation}</p>
                  {aiNote.mnemonic && (
                    <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                      💡 {aiNote.mnemonic}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="mt-6">
        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            显示释义（空格）
          </button>
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-2">
              {gradeButtons.map((b) => (
                <button
                  key={b.grade}
                  onClick={() => submit(b.grade)}
                  disabled={submitting}
                  className={`rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50 ${b.className}`}
                >
                  {b.label}
                  <span className="ml-1 text-[10px] opacity-70">{b.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              按记忆程度评分 · 键盘 1-4 快速评价
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
