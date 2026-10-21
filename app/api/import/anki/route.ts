import { NextResponse } from "next/server";
import { z } from "zod";
import { addCard } from "@/server/cards";
import { getActiveApiUser } from "@/lib/access";

const importSchema = z.object({
  tsv: z.string().min(1),
  lang: z.enum(["en", "ja"]),
});

/** 解析 Anki 导出的 TSV（word / reading / meaning / example），导入当前用户生词本 */
export async function POST(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const lines = parsed.data.tsv
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const dataLines = lines[0]?.startsWith("word\t") ? lines.slice(1) : lines;

  let imported = 0;
  for (const line of dataLines) {
    const [word, reading, meaning] = line.split("\t");
    if (!word) continue;
    await addCard(user.id, {
      word,
      lang: parsed.data.lang,
      reading: reading || undefined,
      meaning: meaning || undefined,
    });
    imported += 1;
  }

  return NextResponse.json({ imported });
}
