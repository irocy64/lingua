/**
 * 基于浏览器内置 Intl.Segmenter 的分词（零依赖）。
 * 支持日语与英语的词级切分。
 */

export interface Token {
  surface: string;
  isWord: boolean;
}

const segmenters: Partial<Record<"en" | "ja", Intl.Segmenter>> = {};

function getSegmenter(lang: "en" | "ja"): Intl.Segmenter {
  if (!segmenters[lang]) {
    const locale = lang === "ja" ? "ja" : "en";
    segmenters[lang] = new Intl.Segmenter(locale, { granularity: "word" });
  }
  return segmenters[lang]!;
}

export function tokenize(text: string, lang: "en" | "ja"): Token[] {
  const segmenter = getSegmenter(lang);
  const segments = segmenter.segment(text);
  const tokens: Token[] = [];
  for (const seg of segments) {
    tokens.push({
      surface: seg.segment,
      isWord: (seg as Intl.SegmentData & { isWordLike?: boolean }).isWordLike ?? false,
    });
  }
  return tokens;
}

/** 把句子切为词（含标点占位），用于渲染可点击词 */
export function tokenizeSentence(sentence: string, lang: "en" | "ja"): Token[] {
  return tokenize(sentence, lang);
}
