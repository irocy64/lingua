"use client";

import { useState } from "react";
import { SpeakButton } from "@/components/speak-button";

interface Note {
  example: string;
  translation: string;
  mnemonic: string;
}

export function AiWordNote({
  word,
  lang,
  meaning,
  reading,
}: {
  word: string;
  lang: "en" | "ja";
  meaning?: string | null;
  reading?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setOpen(true);
    if (note || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, lang, meaning, reading }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      setNote(data.note as Note);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={open ? () => setOpen(false) : load}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        {open ? "收起 AI 讲解" : "✨ AI 讲解"}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-sm">
          {loading && <p className="text-xs text-slate-500">生成中…</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {note && (
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <p className="flex-1">{note.example}</p>
                <SpeakButton
                  text={note.example}
                  lang={lang}
                  rate={0.9}
                  size="sm"
                />
              </div>
              <p className="text-slate-500">{note.translation}</p>
              {note.mnemonic && (
                <p className="text-xs text-amber-800">💡 {note.mnemonic}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
