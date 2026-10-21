import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { getActiveApiUser } from "@/lib/access";
import { isAiConfigured } from "@/lib/ai";
import { generateVocabNote, type VocabNote } from "@/server/ai-tutor";
import {
  checkAiAccess,
  isAiAllowedEmail,
  recordAiUsage,
} from "@/server/ai-access";

const schema = z.union([
  z.object({ cardId: z.string().min(1) }),
  z.object({
    word: z.string().min(1),
    lang: z.enum(["en", "ja"]),
    meaning: z.string().optional(),
    reading: z.string().optional(),
  }),
]);

function readCached(raw: string | null): VocabNote | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<VocabNote>;
    if (!data.example || !data.translation) return null;
    return {
      example: data.example,
      translation: data.translation,
      mnemonic: data.mnemonic ?? "",
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // AI 只对白名单账号开放（缓存也不外泄）
  if (!isAiAllowedEmail(user.email)) {
    return NextResponse.json(
      { error: "AI 功能当前仅对你的账号开放。" },
      { status: 403 }
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const input = parsed.data;

  if ("cardId" in input) {
    const rows = await db
      .select()
      .from(cards)
      .where(and(eq(cards.id, input.cardId), eq(cards.userId, user.id)));
    const card = rows[0];
    if (!card) {
      return NextResponse.json({ error: "card not found" }, { status: 404 });
    }

    const cached = readCached(card.aiNote);
    if (cached) {
      return NextResponse.json({ note: cached, cached: true });
    }

    // 模板已预生成时，直接复制给用户卡片
    if (card.deckId) {
      const [template] = await db
        .select({ aiNote: cards.aiNote })
        .from(cards)
        .where(
          and(
            isNull(cards.userId),
            eq(cards.deckId, card.deckId),
            eq(cards.word, card.word),
            eq(cards.lang, card.lang),
            isNotNull(cards.aiNote)
          )
        )
        .limit(1);
      const templateNote = readCached(template?.aiNote ?? null);
      if (templateNote) {
        await db
          .update(cards)
          .set({ aiNote: JSON.stringify(templateNote) })
          .where(eq(cards.id, card.id));
        return NextResponse.json({ note: templateNote, cached: true });
      }
    }

    const access = await checkAiAccess(user.id, user.email ?? null);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }
    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: "AI 未配置，请在环境变量中设置 AI_API_KEY" },
        { status: 503 }
      );
    }

    try {
      const note = await generateVocabNote(
        card.word,
        card.lang,
        card.meaning,
        card.reading
      );
      const serialized = JSON.stringify(note);
      if (card.deckId) {
        await db
          .update(cards)
          .set({ aiNote: serialized })
          .where(
            and(
              isNull(cards.userId),
              eq(cards.deckId, card.deckId),
              eq(cards.word, card.word),
              eq(cards.lang, card.lang)
            )
          );
      }
      await db
        .update(cards)
        .set({ aiNote: serialized, updatedAt: new Date() })
        .where(eq(cards.id, card.id));
      await recordAiUsage(user.id);
      return NextResponse.json({ note, cached: false });
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 502 }
      );
    }
  }

  const word = input.word.trim();
  const [cachedTemplate] = await db
    .select({ aiNote: cards.aiNote })
    .from(cards)
    .where(
      and(
        isNull(cards.userId),
        eq(cards.word, word),
        eq(cards.lang, input.lang),
        isNotNull(cards.aiNote)
      )
    )
    .limit(1);
  const cachedWordNote = readCached(cachedTemplate?.aiNote ?? null);
  if (cachedWordNote) {
    return NextResponse.json({ note: cachedWordNote, cached: true });
  }

  const access = await checkAiAccess(user.id, user.email ?? null);
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.message },
      { status: access.status }
    );
  }
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI 未配置，请在环境变量中设置 AI_API_KEY" },
      { status: 503 }
    );
  }

  try {
    const note = await generateVocabNote(
      word,
      input.lang,
      input.meaning,
      input.reading
    );
    const serialized = JSON.stringify(note);
    // 写回模板缓存，后续学习同类词可直接命中
    await db
      .update(cards)
      .set({ aiNote: serialized })
      .where(
        and(
          isNull(cards.userId),
          eq(cards.word, word),
          eq(cards.lang, input.lang)
        )
      );
    await recordAiUsage(user.id);
    return NextResponse.json({ note, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502 }
    );
  }
}
