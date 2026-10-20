import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { texts, type TextMaterial } from "@/db/schema";

/** 列出当前用户的材料，并附带公共示例（userId=null） */
export async function listTexts(userId: string): Promise<TextMaterial[]> {
  return db
    .select()
    .from(texts)
    .where(or(eq(texts.userId, userId), isNull(texts.userId)))
    .orderBy(asc(texts.createdAt));
}

/** 获取材料：本人的或公共示例 */
export async function getText(
  userId: string,
  id: string
): Promise<TextMaterial | undefined> {
  const rows = await db
    .select()
    .from(texts)
    .where(
      and(
        eq(texts.id, id),
        or(eq(texts.userId, userId), isNull(texts.userId))
      )
    );
  return rows[0];
}

export interface CreateTextInput {
  title: string;
  content: string;
  lang: "en" | "ja";
  sourceUrl?: string;
}

export async function createText(
  userId: string,
  input: CreateTextInput
): Promise<TextMaterial> {
  const id = crypto.randomUUID();
  await db.insert(texts).values({
    id,
    userId,
    title: input.title,
    content: input.content,
    sourceUrl: input.sourceUrl ?? null,
    lang: input.lang,
  });
  const rows = await db.select().from(texts).where(eq(texts.id, id));
  const created = rows[0];
  if (!created) throw new Error("failed to create text");
  return created;
}

export async function deleteText(userId: string, id: string): Promise<void> {
  await db
    .delete(texts)
    .where(and(eq(texts.id, id), eq(texts.userId, userId)));
}
