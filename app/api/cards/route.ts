import { NextResponse } from "next/server";
import { z } from "zod";
import { addCard, findCard } from "@/server/cards";
import { getActiveApiUser } from "@/lib/access";

const addSchema = z.object({
  word: z.string().min(1),
  lang: z.enum(["en", "ja"]),
  reading: z.string().optional(),
  meaning: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");
  const lang = searchParams.get("lang") as "en" | "ja" | null;

  if (!word || !lang) {
    return NextResponse.json(
      { error: "word and lang required" },
      { status: 400 }
    );
  }

  const card = await findCard(user.id, word, lang);
  return NextResponse.json({ card: card ?? null });
}

export async function POST(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const card = await addCard(user.id, parsed.data);
  return NextResponse.json(card, { status: 201 });
}
