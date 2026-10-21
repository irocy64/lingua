"use client";

import { useState } from "react";
import { speak, type SpeechLang } from "@/lib/speech";

/**
 * 发音按钮：点击朗读传入的文本（浏览器 speechSynthesis）。
 * 放在其他按钮/链接内部时会自动阻止事件冒泡。
 */
export function SpeakButton({
  text,
  lang,
  rate,
  size = "md",
  className = "",
  label,
}: {
  text: string;
  lang: SpeechLang;
  rate?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** 无障碍标签；听写模式可传“播放发音”避免泄露答案 */
  label?: string;
}) {
  const [speaking, setSpeaking] = useState(false);

  if (!text) return null;

  const sizeClass =
    size === "lg"
      ? "h-9 w-9 text-lg"
      : size === "sm"
        ? "h-6 w-6 text-xs"
        : "h-7 w-7 text-sm";

  return (
    <button
      type="button"
      aria-label={label ?? `朗读：${text}`}
      title={label ?? "朗读"}
      onClick={(event) => {
        event.stopPropagation();
        setSpeaking(true);
        const ok = speak(text, lang, {
          rate,
          onEnd: () => setSpeaking(false),
        });
        if (!ok) setSpeaking(false);
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${sizeClass} ${className}`}
    >
      <span aria-hidden>{speaking ? "⏹" : "🔊"}</span>
    </button>
  );
}
