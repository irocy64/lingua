/**
 * 构建内置词库 JSON：从 qwerty-learner 开源词库下载并转换为项目格式。
 * 运行：node scripts/build-wordlists.mjs
 * 生成：db/wordlists/<deckId>.json
 *
 * 数据来源：https://github.com/RealKai42/qwerty-learner （MIT）
 * - CET-6：星火六级词库前 3000 条
 * - 考研：2025 考研红宝书词库
 * - 雅思：IELTS_3_T
 * - 托福：TOEFL_3_T
 * - JLPT N2 / N5：JapVocabList.*_zh（含中文释义）
 */
import fs from "node:fs";
import path from "node:path";

const BASE =
  "https://raw.githubusercontent.com/RealKai42/qwerty-learner/master/public/dicts";
const OUT = path.resolve("db/wordlists");

/** @type {Array<{file:string, deckId:string, name:string, language:'en'|'ja', description:string, limit?:number, kind:'en'|'ja'}>} */
const sources = [
  {
    file: "xinghuoqiaoji_6.json",
    deckId: "builtin-cet6",
    name: "CET-6 词汇（星火全本）",
    language: "en",
    description:
      "大学英语六级词汇全本（去重后 6005 词，含 3000+ 核心）。源：星火六级词库 / qwerty-learner，MIT 许可",
    kind: "en",
  },
  {
    file: "2025KaoYanHongBaoShu.json",
    deckId: "builtin-kaoyan",
    name: "考研英语红宝书",
    language: "en",
    description:
      "考研英语核心词汇（源：2025 考研红宝书词库 / qwerty-learner，MIT 许可）",
    kind: "en",
  },
  {
    file: "IELTS_3_T.json",
    deckId: "builtin-ielts",
    name: "雅思核心词汇",
    language: "en",
    description: "雅思听说读写高频词汇（源：qwerty-learner，MIT 许可）",
    kind: "en",
  },
  {
    file: "TOEFL_3_T.json",
    deckId: "builtin-toefl",
    name: "托福核心词汇",
    language: "en",
    description: "托福阅读听力高频词汇（源：qwerty-learner，MIT 许可）",
    kind: "en",
  },
  {
    file: "Jap_High-Frequency_N2.json",
    deckId: "builtin-jlpt-n2",
    name: "JLPT N2 词汇",
    language: "ja",
    description:
      "日语能力考 N2 高频 2500 词，含音调、词性与中文释义（源：qwerty-learner，MIT 许可）",
    kind: "ja",
  },
  {
    file: "JapVocabList.N5_zh.json",
    deckId: "builtin-jlpt-n5",
    name: "JLPT N5 词汇",
    language: "ja",
    description: "日语能力考 N5 入门词汇，中文释义（源：qwerty-learner，MIT 许可）",
    kind: "ja",
  },
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJapaneseNotation(notation) {
  const text = cleanText(notation);
  if (!text) return { word: "", reading: "" };

  let word = "";
  let reading = "";
  let last = 0;
  const re = /([\p{Script=Han}々]+)\(([^()]*)\)/gu;
  let match;
  while ((match = re.exec(text)) !== null) {
    const before = text.slice(last, match.index);
    word += before;
    reading += before;
    word += match[1];
    reading += match[2];
    last = match.index + match[0].length;
  }
  const tail = text.slice(last);
  word += tail;
  reading += tail;
  return { word: cleanText(word), reading: cleanText(reading) };
}

async function loadSource(source) {
  const url = `${BASE}/${source.file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${source.file} -> HTTP ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error(`${source.file} 不是数组`);

  const seen = new Set();
  const cards = [];

  for (const entry of raw) {
    let word = "";
    let reading = "";
    let meaning = "";

    if (source.kind === "ja") {
      const parsed = parseJapaneseNotation(entry.notation || entry.name);
      word = parsed.word;
      reading = parsed.reading;
      const trans = Array.isArray(entry.trans) ? entry.trans : [entry.trans];
      meaning = trans.map(cleanText).filter(Boolean).join("；");
    } else {
      word = cleanText(entry.name);
      const phonetic = cleanText(entry.usphone || entry.ukphone);
      reading = phonetic ? `/${phonetic.replace(/^\/|\/$/g, "")}/` : "";
      const trans = Array.isArray(entry.trans) ? entry.trans : [entry.trans];
      meaning = trans.map(cleanText).filter(Boolean).join("；");
    }

    if (!word || !meaning) continue;
    if (word.length > 60 || meaning.length > 500) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    cards.push({
      id: `${source.deckId}-${cards.length + 1}`,
      word,
      ...(reading ? { reading } : {}),
      meaning,
    });

    if (source.limit && cards.length >= source.limit) break;
  }

  return {
    id: source.deckId,
    name: source.name,
    language: source.language,
    description: source.description,
    cards,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const source of sources) {
    const deck = await loadSource(source);
    const file = path.join(OUT, `${source.deckId}.json`);
    fs.writeFileSync(file, JSON.stringify(deck));
    console.log(
      `${source.deckId}: ${deck.cards.length} 词 -> ${path.relative(
        process.cwd(),
        file
      )} (${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
