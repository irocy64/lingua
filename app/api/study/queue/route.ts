import { NextResponse } from "next/server";
import { getStudyQueue } from "@/server/study";
import { getActiveApiUser } from "@/lib/access";

export async function GET(request: Request) {
  const user = await getActiveApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deck = searchParams.get("deck") ?? undefined;
  const queue = await getStudyQueue(user.id, deck);
  return NextResponse.json(queue);
}
