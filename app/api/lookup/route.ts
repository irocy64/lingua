import { NextResponse } from "next/server";
import { lookupWord } from "@/server/lookup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");
  const lang = searchParams.get("lang") as "en" | "ja" | null;

  if (!word || !lang) {
    return NextResponse.json({ error: "word and lang required" }, { status: 400 });
  }

  try {
    const result = await lookupWord(word, lang);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502 }
    );
  }
}
