import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cards } from "@/db/schema";

/** 生成当前用户的 Anki 可导入 TSV（word / reading / meaning / example） */
export async function buildAnkiTsv(
  userId: string,
  lang?: "en" | "ja"
): Promise<string> {
  const rows = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));
  const filtered = lang ? rows.filter((c) => c.lang === lang) : rows;

  const lines = filtered.map((c) =>
    [c.word, c.reading ?? "", c.meaning ?? "", c.example ?? ""]
      .map((field) => field.replace(/\t/g, " ").replace(/\n/g, " "))
      .join("\t")
  );

  return ["word\treading\tmeaning\texample", ...lines].join("\n");
}
