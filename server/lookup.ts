/**
 * 词典查询（服务端代理，规避浏览器 CORS 与解析差异）
 * - 日语：jisho.org API
 * - 英语：dictionaryapi.dev
 */

export interface LookupResult {
  word: string;
  reading?: string;
  meanings: string[];
}

async function lookupJapanese(word: string): Promise<LookupResult> {
  const res = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`,
    { next: { revalidate: 86400 } }
  );
  const data = await res.json();
  const first = data?.data?.[0];

  if (!first) return { word, meanings: [] };

  const reading = first.japanese?.[0]?.reading;
  const meanings: string[] =
    first.senses?.flatMap((s: { english_definitions: string[] }) => s.english_definitions) ?? [];

  return { word, reading, meanings: meanings.slice(0, 5) };
}

async function lookupEnglish(word: string): Promise<LookupResult> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return { word, meanings: [] };

  const data = await res.json();
  const first = data?.[0];
  const meanings: string[] =
    first?.meanings?.flatMap(
      (m: { definitions: { definition: string }[] }) =>
        m.definitions.map((d) => d.definition)
    ) ?? [];

  return {
    word,
    reading: first?.phonetic ?? undefined,
    meanings: meanings.slice(0, 5),
  };
}

export function lookupWord(word: string, lang: "en" | "ja") {
  return lang === "ja" ? lookupJapanese(word) : lookupEnglish(word);
}
