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

export const db = drizzle(client, { schema });
export { schema };
