"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImportForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        lang,
        sourceUrl: sourceUrl || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/reader/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "创建失败，请检查输入");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium">标题</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="给文章起个名字"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">语言</label>
        <div className="mt-1 flex gap-2">
          {(["en", "ja"] as const).map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-lg border px-4 py-2 text-sm ${
                lang === l
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              {l === "en" ? "英语" : "日语"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">来源 URL（可选）</label>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          type="url"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">正文</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="粘贴或输入文章内容"
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "导入中…" : "导入并开始阅读"}
      </button>
    </form>
  );
}
