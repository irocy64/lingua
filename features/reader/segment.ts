/**
 * 将文本切分为段落与句子。
 */

export interface Sentence {
  text: string;
}

export interface Paragraph {
  sentences: Sentence[];
}

// 句子边界（含中英文/日文标点）
const SENTENCE_RE = /[^。！？!?\.\n]+[。！？!?\.]*\n?/g;

export function segmentText(content: string): Paragraph[] {
  const rawParagraphs = content.split(/\n+/).filter((p) => p.trim().length > 0);

  return rawParagraphs.map((p) => {
    const matches = p.match(SENTENCE_RE) ?? [p];
    const sentences = matches
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((text) => ({ text }));
    return { sentences };
  });
}
