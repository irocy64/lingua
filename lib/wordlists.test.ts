import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface Wordlist {
  id: string;
  language: "en" | "ja";
  cards: { id: string; word: string; reading?: string; meaning: string }[];
}

const dir = path.join(process.cwd(), "db", "wordlists");
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json"));

const minimums: Record<string, number> = {
  "builtin-cet6": 3000,
  "builtin-kaoyan": 6000,
  "builtin-ielts": 3000,
  "builtin-toefl": 4000,
  "builtin-jlpt-n2": 2000,
  "builtin-jlpt-n5": 600,
};

describe("内置词库数据", () => {
  it("覆盖六级/考研/雅思/托福/N2/N5", () => {
    const ids = files.map((file) => {
      const deck: Wordlist = JSON.parse(
        fs.readFileSync(path.join(dir, file), "utf8")
      );
      return deck.id;
    });
    for (const id of Object.keys(minimums)) {
      expect(ids).toContain(id);
    }
  });

  for (const file of files) {
    it(`${file} 词数达标且词条有效`, () => {
      const deck: Wordlist = JSON.parse(
        fs.readFileSync(path.join(dir, file), "utf8")
      );
      expect(deck.cards.length).toBeGreaterThanOrEqual(minimums[deck.id] ?? 1);

      const ids = new Set<string>();
      const words = new Set<string>();
      for (const card of deck.cards) {
        expect(card.word.trim().length).toBeGreaterThan(0);
        expect(card.meaning.trim().length).toBeGreaterThan(0);
        expect(ids.has(card.id)).toBe(false);
        expect(words.has(card.word.toLowerCase())).toBe(false);
        ids.add(card.id);
        words.add(card.word.toLowerCase());
      }
    });
  }

  it("日语词条带假名读音", () => {
    for (const file of files) {
      const deck: Wordlist = JSON.parse(
        fs.readFileSync(path.join(dir, file), "utf8")
      );
      if (deck.language !== "ja") continue;
      for (const card of deck.cards) {
        expect(card.reading?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});
