"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export function AiExplainPanel({
  text,
  lang,
  onClose,
}: {
  text: string;
  lang: "en" | "ja";
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "讲解失败");
        } else if (!cancelled) {
          setContent(data.explanation);
        }
      } catch {
        if (!cancelled) setError("网络错误");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [text, lang]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">AI 精读讲解</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {text}
        </p>

        <div className="mt-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">AI 正在生成讲解…</p>
          ) : error ? (
            <p className="py-6 text-center text-sm text-rose-600">{error}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
