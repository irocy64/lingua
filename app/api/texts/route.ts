import { NextResponse } from "next/server";
import { z } from "zod";
import { createText, listTexts } from "@/server/reader";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  lang: z.enum(["en", "ja"]),
  sourceUrl: z.string().url().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listTexts(session.user.id));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const created = await createText(session.user.id, parsed.data);
  return NextResponse.json(created, { status: 201 });
}
