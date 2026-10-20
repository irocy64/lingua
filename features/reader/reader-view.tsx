"use client";

import { useState } from "react";
import { segmentText } from "./segment";
import { tokenizeSentence } from "./tokenize";
import { WordPanel } from "./word-panel";
import { AiExplainPanel } from "./ai-explain-panel";
import { SpeakButton } from "@/components/speak-button";

export function ReaderView({
  title,
  content,
  lang,
  sourceUrl,
}: {
  title: string;
  content: string;
  lang: "en" | "ja";
  sourceUrl?: string | null;
}) {
  const paragraphs = segmentText(content);
  const [selected, setSelected] = useState<string | null>(null);
  const [aiTarget, setAiTarget] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  function handleSaved(word: string) {
    setSavedWords((prev) => {
      const next = new Set(prev);
      next.add(word);
      return next;
    });
  }

  return (
    <article>
      <h1 className="text-2xl font-bold">{title}</h1>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs text-slate-400 hover:underline"
        >
          {sourceUrl}
        </a>
      )}

      <div
        className={`mt-6 space-y-4 leading-loose text-slate-800 ${
          lang === "ja" ? "text-lg" : "text-base"
        }`}
      >
        {paragraphs.map((para, pi) => (
          <p key={pi}>
            {para.sentences.map((s, si) => {
              const tokens = tokenizeSentence(s.text, lang);
              return (
                <span key={si} className="mr-1">
                  {tokens.map((token, ti) =>
                    token.isWord ? (
                      <button
                        key={ti}
                        onClick={() => setSelected(token.surface)}
                        className={`rounded px-0.5 transition-colors ${
                          savedWords.has(token.surface)
                            ? "bg-emerald-100 text-emerald-800"
                            : "hover:bg-slate-200"
                        }`}
                      >
                        {token.surface}
                      </button>
                    ) : (
                      <span key={ti}>{token.surface}</span>
                    )
                  )}
                  <button
                    onClick={() => setAiTarget(s.text)}
                    title="AI 讲解此句"
                    className="ml-0.5 align-middle rounded border border-slate-200 px-1 text-[10px] text-slate-400 hover:bg-slate-900 hover:text-white"
                  >
                    AI
                  </button>
                  <SpeakButton
                    text={s.text}
                    lang={lang}
                    size="sm"
                    rate={0.9}
                    className="ml-0.5 align-middle"
                  />
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        点击任意单词可查词并加入生词本
      </p>

      {selected && (
        <WordPanel
          word={selected}
          lang={lang}
          onSaved={handleSaved}
          onClose={() => setSelected(null)}
        />
      )}

      {aiTarget && (
        <AiExplainPanel
          text={aiTarget}
          lang={lang}
          onClose={() => setAiTarget(null)}
        />
      )}
    </article>
  );
}
