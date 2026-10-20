import { chatCompletion, isAiConfigured, type ChatMessage } from "@/lib/ai";

const languageName: Record<"en" | "ja", string> = {
  en: "英语",
  ja: "日语",
};

function teacherSystem(lang: "en" | "ja"): string {
  const target = languageName[lang];
  return `你是一名资深${target}教师，学生是中文母语者。请用简体中文讲解，条理清晰、难度适中，多用对照。`;
}

/** AI 精读讲解：对选中文本做翻译、重点词、语法句式讲解 */
export async function explainSelection(
  text: string,
  lang: "en" | "ja",
  context?: string
): Promise<string> {
  const userParts = [
    `请讲解下面这段${languageName[lang]}文本。`,
    context ? `上下文：${context}` : "",
    `待讲解文本：${text}`,
    `请按以下结构输出（Markdown）：
1. **整句翻译**
2. **重点词汇/短语**（词：词性、释义，必要时标注${lang === "ja" ? "假名读音" : "音标"}）
3. **语法/句式**（关键结构与用法）
4. **补充**（易错点或文化背景，没有可省略）`,
  ].filter(Boolean);

  const messages: ChatMessage[] = [
    { role: "system", content: teacherSystem(lang) },
    { role: "user", content: userParts.join("\n") },
  ];

  return chatCompletion(messages, { temperature: 0.3 });
}

/** AI 口语对话：传入历史消息，返回 tutor 回复（含纠错） */
export async function chatWithTutor(
  history: { role: "user" | "assistant"; content: string }[],
  lang: "en" | "ja",
  scenario?: string
): Promise<string> {
  const target = languageName[lang];
  const system = [
    teacherSystem(lang),
    `你正在和学生进行${target}情景对话，扮演自然、友好的对话伙伴。`,
    scenario ? `本次情景：${scenario}。` : "",
    `要求：
- 主要用${target}回复，每次回复控制在 2-3 句，推动对话继续（可适当提问）；
- 若学生上一句有语法、用词或表达不地道的问题，在回复正文之后另起一行，以「反馈：」开头，用简体中文指出错误并给出更地道的说法；没有问题则不写反馈。`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  return chatCompletion(messages, { temperature: 0.7 });
}

/** AI 写作批改：逐句检查并给出修改稿 */
export async function correctWriting(
  essay: string,
  lang: "en" | "ja",
  prompt?: string
): Promise<string> {
  const target = languageName[lang];
  const user = [
    prompt ? `写作题目/要求：${prompt}` : "",
    `学生作文：${essay}`,
    `请按以下结构输出（Markdown，全部用简体中文讲解）：
1. **总体评价**（一两句，含水平判断）
2. **逐句/逐处问题**：引用原文片段 → 说明问题（语法/用词/搭配/标点）→ 给出修改建议
3. **修改稿**：给出修改后的完整${target}作文
4. **可积累表达**：列出 2-3 个更地道的表达`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: teacherSystem(lang) },
    { role: "user", content: user },
  ];

  return chatCompletion(messages, { temperature: 0.3 });
}

export { isAiConfigured };
