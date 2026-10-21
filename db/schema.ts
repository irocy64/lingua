import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------- 用户 ----------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  nickname: text("nickname"),
  dailyNewTarget: integer("daily_new_target").notNull().default(15),
  dailyReviewTarget: integer("daily_review_target").notNull().default(100),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------- 词书 ----------
export const decks = sqliteTable("decks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language", { enum: ["en", "ja"] }).notNull(),
  description: text("description"),
  isBuiltin: integer("is_builtin", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------- 卡片 / 词汇 ----------
export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    deckId: text("deck_id").references(() => decks.id),
    userId: text("user_id").references(() => users.id),
    word: text("word").notNull(),
    reading: text("reading"),
    meaning: text("meaning"),
    example: text("example"),
    exampleTranslation: text("example_translation"),
    audioUrl: text("audio_url"),
    lang: text("lang", { enum: ["en", "ja"] }).notNull(),
    // new / learning / mastered / suspended
    state: text("state", { enum: ["new", "learning", "mastered", "suspended"] })
      .notNull()
      .default("new"),
    // FSRS 调度状态（JSON）
    fsrsData: text("fsrs_data"),
    dueAt: integer("due_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    // 同一词书内去重；不同词书允许同一单词各自独立调度
    uniqueIndex("cards_user_deck_word_lang_idx").on(
      table.userId,
      table.deckId,
      table.word,
      table.lang
    ),
    // 学习队列 / 统计查询
    index("cards_user_state_due_idx").on(
      table.userId,
      table.state,
      table.dueAt
    ),
    index("cards_deck_template_idx").on(table.deckId, table.userId),
  ]
);

// ---------- 复习记录 ----------
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  // again / hard / good / easy
  rating: text("rating", { enum: ["again", "hard", "good", "easy"] }).notNull(),
  elapsedDays: integer("elapsed_days"),
  // 该次复习是否为新词首次学习，用于统计“今日新学”
  wasNew: integer("was_new", { mode: "boolean" }).notNull().default(false),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => [
  index("reviews_user_reviewed_idx").on(table.userId, table.reviewedAt),
]);

// ---------- 阅读材料 ----------
export const texts = sqliteTable("texts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  lang: text("lang", { enum: ["en", "ja"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------- 学习会话（统计） ----------
export const studySessions = sqliteTable("study_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  // learn / review / reading / chat
  type: text("type", {
    enum: ["learn", "review", "reading", "chat"],
  }).notNull(),
  cardsCount: integer("cards_count").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  endedAt: integer("ended_at", { mode: "timestamp" }),
});

export type User = typeof users.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type TextMaterial = typeof texts.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
