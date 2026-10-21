/**
 * 诊断脚本：用本地保存的 RSS 样本验证解析结果（不依赖实时网络）。
 * 运行：npx tsx scripts/check-feed-samples.ts
 */
import fs from "node:fs";
import path from "node:path";
import { listeningFeeds, readingFeeds } from "@/lib/feeds";
import { parseFeedXml } from "@/server/feeds";

const dir = "C:/Users/Mayn/Apps/feed-samples";

for (const source of [...readingFeeds, ...listeningFeeds]) {
  const file = path.join(dir, `${source.id}.xml`);
  if (!fs.existsSync(file)) {
    console.log(`SKIP ${source.id} (no sample)`);
    continue;
  }
  const items = parseFeedXml(fs.readFileSync(file, "utf8"), source);
  const audio = items.filter((item) => item.audioUrl).length;
  console.log(
    `OK ${source.id.padEnd(24)} items=${String(items.length).padStart(2)} audio=${audio}`
  );
  const first = items[0];
  if (first) {
    console.log(
      `   ${first.title.slice(0, 60)} | ${first.publishedAt.slice(0, 10)} | audio=${first.audioUrl ? "yes" : "no"}`
    );
  }
}
