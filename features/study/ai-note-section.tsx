"use client";

import { SpeakButton } from "@/components/speak-button";

export interface AiVocabNote {
  example: string;
  translation: string;
  mnemonic: string;
}

export function AiNoteSection({
  lang,
  note,
  loading,
  error,
  onGenerate,
}: {
  lang: "en" | "ja";
  note?: AiVocabNote;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">✨ AI 例句 / 助记</p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "生成中…" : note ? "重新生成" : "生成"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      {note && (
        <div className="mt-2 space-y-1.5 text-sm">
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
            <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
              💡 {note.mnemonic}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
