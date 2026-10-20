import { NextResponse } from "next/server";
import { z } from "zod";
import { correctWriting } from "@/server/ai-tutor";
import { isAiConfigured } from "@/lib/ai";

const writingSchema = z.object({
  essay: z.string().min(1),
  lang: z.enum(["en", "ja"]),
  prompt: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI 未配置，请在 .env 中设置 AI_API_KEY（见 .env.example）" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = writingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const feedback = await correctWriting(
      parsed.data.essay,
      parsed.data.lang,
      parsed.data.prompt
    );
    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502 }
    );
  }
}
