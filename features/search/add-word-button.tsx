"use client";

import { useState } from "react";

export function AddWordButton({
  word,
  lang,
  reading,
  meaning,
  owned,
}: {
  word: string;
  lang: "en" | "ja";
  reading?: string | null;
  meaning?: string | null;
  owned: boolean;
}) {
  const [added, setAdded] = useState(owned);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, lang, reading, meaning }),
      });
      if (!res.ok) throw new Error("加入失败");
      setAdded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (added) {
    return (
      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
        已在生词本
      </span>
    );
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={add}
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "加入中…" : "加入生词本"}
      </button>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
