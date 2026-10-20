"use client";

export type SpeechLang = "en" | "ja";

function langTag(lang: SpeechLang): string {
  return lang === "ja" ? "ja-JP" : "en-US";
}

/**
 * 使用浏览器内置语音合成朗读单词/句子。
 * 不依赖网络与第三方 API；不支持的浏览器返回 false。
 */
export function speak(
  text: string,
  lang: SpeechLang,
  options: { rate?: number; onEnd?: () => void } = {}
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langTag(lang);
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = 1;

  const prefix = lang === "ja" ? "ja" : "en";
  const voices = synth.getVoices();
  const match = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(prefix)
  );
  if (match) utterance.voice = match;

  if (options.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  synth.speak(utterance);
  return true;
}

/** 浏览器是否支持语音合成（仅客户端调用） */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
