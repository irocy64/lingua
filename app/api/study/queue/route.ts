import { NextResponse } from "next/server";
import { getStudyQueue } from "@/server/study";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deck = searchParams.get("deck") ?? undefined;
  const queue = await getStudyQueue(session.user.id, deck);
  return NextResponse.json(queue);
}
