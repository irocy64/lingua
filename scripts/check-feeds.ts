/**
 * 诊断脚本：检查所有 RSS 源是否可解析、条目数量与音频字段。
 * 运行：npx tsx scripts/check-feeds.ts
 */
import { listeningFeeds, readingFeeds } from "@/lib/feeds";
import { getFeedItems } from "@/server/feeds";

async function main() {
  for (const source of [...readingFeeds, ...listeningFeeds]) {
    try {
      const items = await getFeedItems(source);
      const audioCount = items.filter((item) => item.audioUrl).length;
      console.log(
        `OK  ${source.id.padEnd(26)} items=${String(items.length).padStart(2)} audio=${audioCount}  ${items[0]?.title ?? ""}`
      );
    } catch (error) {
      console.log(`ERR ${source.id.padEnd(26)} ${(error as Error).message}`);
    }
  }
}

main();
