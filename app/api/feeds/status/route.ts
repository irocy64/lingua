import { NextResponse } from "next/server";
import { getActiveApiUser } from "@/lib/access";
import { listeningFeeds, readingFeeds } from "@/lib/feeds";
import { getFeedItems } from "@/server/feeds";

/** 诊断 RSS 源可用性与耗时（需登录的已审核用户） */
export async function GET() {
  const user = await getActiveApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources = [...readingFeeds, ...listeningFeeds];
  const results = await Promise.all(
    sources.map(async (source) => {
      const start = Date.now();
      try {
        const items = await getFeedItems(source);
        return {
          id: source.id,
          ok: true,
          ms: Date.now() - start,
          items: items.length,
          audio: items.filter((item) => item.audioUrl).length,
        };
      } catch (error) {
        return {
          id: source.id,
          ok: false,
          ms: Date.now() - start,
          error: (error as Error).message,
        };
      }
    })
  );

  return NextResponse.json({ results });
}
