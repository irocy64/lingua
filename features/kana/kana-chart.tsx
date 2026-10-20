"use client";

import { useCallback, useMemo, useState } from "react";
import { SpeakButton } from "@/components/speak-button";
import { speak } from "@/lib/speech";
import { kanaRows, type KanaCell } from "./kana-data";

type Mode = "hiragana" | "katakana";
type Tab = "chart" | "quiz";

interface Question {
  cell: KanaCell;
  options: string[];
}

export function KanaChart() {
  const [mode, setMode] = useState<Mode>("hiragana");
  const [tab, setTab] = useState<Tab>("chart");

  const allCells = useMemo(
    () => kanaRows.flat().filter((cell): cell is KanaCell => cell !== null),
    []
  );

  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const makeQuestion = useCallback((): Question => {
    const cell = allCells[Math.floor(Math.random() * allCells.length)];
    const options = new Set<string>([cell.romaji]);
    while (options.size < 4) {
      const candidate = allCells[Math.floor(Math.random() * allCells.length)];
      options.add(candidate.romaji);
    }
    return {
      cell,
      options: [...options].sort(() => Math.random() - 0.5),
    };
  }, [allCells]);

  function startQuiz() {
    setTab("quiz");
    if (!question) setQuestion(makeQuestion());
    setPicked(null);
  }

  function answer(option: string) {
    if (!question || picked) return;
    setPicked(option);
    setScore((prev) => ({
      correct: prev.correct + (option === question.cell.romaji ? 1 : 0),
      total: prev.total + 1,
    }));
  }

  function nextQuestion() {
    setQuestion(makeQuestion());
    setPicked(null);
  }

  const character = (cell: KanaCell) => cell[mode];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 p-1">
          {(["hiragana", "katakana"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                mode === m
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {m === "hiragana" ? "平假名" : "片假名"}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => setTab("chart")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              tab === "chart"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            假名表
          </button>
          <button
            onClick={startQuiz}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              tab === "quiz"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            认读测验
          </button>
        </div>
      </div>

      {tab === "chart" ? (
        <div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <tbody>
                {kanaRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-slate-100 last:border-0"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`p-2 text-center ${
                          cell ? "group hover:bg-slate-50" : "bg-slate-50/50"
                        }`}
                      >
                        {cell ? (
                          <button
                            type="button"
                            onClick={() => speak(character(cell), "ja", { rate: 0.8 })}
                            title={`${cell.romaji}（点击朗读）`}
                            className="w-full rounded-md py-1"
                          >
                            <p className="text-2xl font-semibold text-slate-900">
                              {character(cell)}
                            </p>
                            <p className="text-xs text-slate-400 group-hover:text-slate-600">
                              {cell.romaji}
                            </p>
                          </button>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            点击任意假名即可听发音
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 p-8">
          {!question ? (
            <p className="py-10 text-center text-slate-500">准备中…</p>
          ) : (
            <div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  答对 {score.correct} / {score.total}
                </span>
                <button
                  onClick={() => {
                    setQuestion(makeQuestion());
                    setPicked(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  换一题
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-6xl font-bold text-slate-900">
                  {character(question.cell)}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <SpeakButton text={character(question.cell)} lang="ja" size="md" />
                  <span className="text-xs text-slate-400">听发音</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {question.options.map((option) => {
                  const isAnswer = option === question.cell.romaji;
                  const isPicked = option === picked;
                  let className =
                    "rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50";
                  if (picked && isAnswer) {
                    className =
                      "rounded-lg border border-emerald-500 bg-emerald-50 py-3 text-sm font-medium text-emerald-700";
                  } else if (isPicked && !isAnswer) {
                    className =
                      "rounded-lg border border-rose-400 bg-rose-50 py-3 text-sm font-medium text-rose-700";
                  }
                  return (
                    <button
                      key={option}
                      onClick={() => answer(option)}
                      disabled={!!picked}
                      className={className}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {picked && (
                <div className="mt-6 text-center">
                  <p
                    className={`text-sm ${
                      picked === question.cell.romaji
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {picked === question.cell.romaji
                      ? "回答正确"
                      : `正确答案是 ${question.cell.romaji}`}
                  </p>
                  <button
                    onClick={nextQuestion}
                    className="mt-3 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    下一题
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
