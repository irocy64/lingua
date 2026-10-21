import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai";
import { generateVocabNote, type VocabNote } from "@/server/ai-tutor";

const schema = z.object({ cardId: z.string().min(1) });

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(cards)
    .where(
      and(eq(cards.id, parsed.data.cardId), eq(cards.userId, session.user.id))
    );
  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "card not found" }, { status: 404 });
  }

  const cached = readCached(card.aiNote);
  if (cached) {
    return NextResponse.json({ note: cached, cached: true });
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
    await db
      .update(cards)
      .set({ aiNote: JSON.stringify(note), updatedAt: new Date() })
      .where(eq(cards.id, card.id));
    return NextResponse.json({ note, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502 }
    );
  }
}
