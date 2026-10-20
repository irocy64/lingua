import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  // libSQL / Turso：本地 file: 与远程 libsql:// 均支持
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/lingua.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
