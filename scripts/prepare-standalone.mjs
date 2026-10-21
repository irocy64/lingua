/**
 * 把 Next standalone 需要的静态资源复制进去。
 * Netlify 构建不会生成 .next/standalone（output 被禁用），此时跳过。
 */
import { cpSync, existsSync } from "node:fs";

const standalone = ".next/standalone";

if (!existsSync(standalone)) {
  console.log("[prepare-standalone] .next/standalone not found, skipped");
  process.exit(0);
}

if (existsSync(".next/static")) {
  cpSync(".next/static", `${standalone}/.next/static`, {
    recursive: true,
    force: true,
  });
}

if (existsSync("public")) {
  cpSync("public", `${standalone}/public`, { recursive: true, force: true });
}

console.log("[prepare-standalone] static assets copied");
