"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export function WritingPractice() {
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  async function submit() {
    if (!essay.trim() || loading) return;
    setLoading(true);
    setError("");
    setFeedback("");

    const res = await fetch("/api/ai/writing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        essay,
        lang,
        prompt: prompt || undefined,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setFeedback(data.feedback);
    } else {
      setError(data.error ?? "批改失败");
    }
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 输入区 */}
      <div>
        <div className="flex gap-2 pb-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            {(["en", "ja"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-md px-3 py-1 text-sm ${
                  lang === l ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                {l === "en" ? "英语" : "日语"}
              </button>
            ))}
          </div>
        </div>

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="写作题目/要求（可选）"
        />

        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          rows={14}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder={lang === "en" ? "Paste or write your essay..." : "日本語の作文を入力…"}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {lang === "en" ? `词数：${wordCount}` : "字数：" + essay.length}
          </span>
          <button
            onClick={submit}
            disabled={loading || !essay.trim()}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "批改中…" : "提交批改"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      {/* 结果区 */}
      <div className="rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold">批改结果</h2>
        <div className="mt-3">
          {loading ? (
            <p className="py-16 text-center text-sm text-slate-500">AI 正在批改…</p>
          ) : feedback ? (
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">
              提交作文后，将显示逐句批改与修改稿
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
