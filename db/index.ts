import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * 数据库连接（libSQL / Turso）
 * - 本地开发：DATABASE_URL=file:./data/lingua.db
 * - Vercel：DATABASE_URL=libsql://<db>.turso.io，DATABASE_AUTH_TOKEN=***
 */
const url = process.env.DATABASE_URL ?? "file:./data/lingua.db";

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// 本地 SQLite 并发访问时避免 SQLITE_BUSY（Turso 远程不需要）
if (url.startsWith("file:")) {
  void client
    .batch(["PRAGMA journal_mode = WAL", "PRAGMA busy_timeout = 5000"])
    .catch(() => undefined);
}

export const db = drizzle(client, { schema });
export { schema };
