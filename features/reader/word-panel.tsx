"use client";

import { useEffect, useState } from "react";
import type { LookupResult } from "@/server/lookup";
import type { Card } from "@/db/schema";
import { SpeakButton } from "@/components/speak-button";

export function WordPanel({
  word,
  lang,
  onSaved,
  onClose,
}: {
  word: string;
  lang: "en" | "ja";
  onSaved: (word: string) => void;
  onClose: () => void;
}) {
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [existing, setExisting] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [lookupData, cardData] = await Promise.all([
          fetch(
            `/api/lookup?word=${encodeURIComponent(word)}&lang=${lang}`
          ).then((r) => r.json()),
          fetch(
            `/api/cards?word=${encodeURIComponent(word)}&lang=${lang}`
          ).then((r) => r.json()),
        ]);
        if (!cancelled) {
          setLookup(lookupData);
          setExisting(cardData?.card ?? null);
        }
      } catch {
        if (!cancelled) setError("查询失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [word, lang]);

  async function addToVocabulary() {
    setAdding(true);
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word,
        lang,
        reading: lookup?.reading,
        meaning: lookup?.meanings?.[0],
      }),
    });
    if (res.ok) {
      const card = await res.json();
      setExisting(card);
      onSaved(word);
    } else {
      setError("加入失败");
    }
    setAdding(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{word}</p>
              <SpeakButton text={word} lang={lang} size="md" />
            </div>
            {lookup?.reading && (
              <p className="mt-1 text-sm text-slate-500">{lookup.reading}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">查询中…</p>
        ) : (
          <div className="mt-4">
            {lookup?.meanings && lookup.meanings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {lookup.meanings.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">未查到释义，可手动加入后补充</p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-6">
          {existing ? (
            <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-center text-sm text-emerald-700">
              已在生词本（状态：{existing.state}）
            </p>
          ) : (
            <button
              onClick={addToVocabulary}
              disabled={adding || loading}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {adding ? "加入中…" : "加入生词本（进入复习）"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
