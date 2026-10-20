import { eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { users, cards, type User } from "@/db/schema";

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return rows[0];
}

export async function findUserById(id: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows[0];
}

/**
 * 把内置词书的公共模板（userId=null）同步为用户私有卡片。
 * 已存在的词（按 userId + word 去重）不会被覆盖，因此可重复调用。
 * @returns 本次新增的卡片数量
 */
export async function syncBuiltinCards(userId: string): Promise<number> {
  const templates = await db.select().from(cards).where(isNull(cards.userId));
  if (templates.length === 0) return 0;

  const owned = await db
    .select({ word: cards.word, lang: cards.lang })
    .from(cards)
    .where(eq(cards.userId, userId));
  const ownedKeys = new Set(owned.map((row) => `${row.lang}:${row.word}`));

  const seen = new Set<string>();
  const missing = templates.filter((t) => {
    const key = `${t.lang}:${t.word}`;
    if (ownedKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (missing.length === 0) return 0;

  await db.insert(cards).values(
    missing.map((t) => ({
      id: randomUUID(),
      userId,
      deckId: t.deckId,
      word: t.word,
      reading: t.reading,
      meaning: t.meaning,
      example: t.example,
      exampleTranslation: t.exampleTranslation,
      lang: t.lang,
      state: "new" as const,
    }))
  );

  return missing.length;
}

/** 为新用户初始化独立的词书卡片 */
async function provisionUserCards(userId: string): Promise<void> {
  await syncBuiltinCards(userId);
}

export async function registerUser(
  email: string,
  password: string,
  nickname?: string
): Promise<User> {
  const normalized = email.trim().toLowerCase();
  if (await findUserByEmail(normalized)) {
    throw new Error("该邮箱已注册");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await db.insert(users).values({
    id,
    email: normalized,
    passwordHash,
    nickname: nickname ?? normalized.split("@")[0],
  });

  await provisionUserCards(id);

  const created = await findUserByEmail(normalized);
  if (!created) throw new Error("注册失败");
  return created;
}

export async function updateSettings(
  id: string,
  patch: {
    nickname?: string;
    dailyNewTarget?: number;
    dailyReviewTarget?: number;
  }
): Promise<User> {
  const clean: typeof patch = {};
  if (patch.nickname !== undefined) {
    clean.nickname = patch.nickname.trim().slice(0, 30) || "学习者";
  }
  if (patch.dailyNewTarget !== undefined) {
    clean.dailyNewTarget = Math.min(
      100,
      Math.max(1, Math.round(patch.dailyNewTarget) || 15)
    );
  }
  if (patch.dailyReviewTarget !== undefined) {
    clean.dailyReviewTarget = Math.min(
      500,
      Math.max(10, Math.round(patch.dailyReviewTarget) || 100)
    );
  }

  if (Object.keys(clean).length > 0) {
    await db.update(users).set(clean).where(eq(users.id, id));
  }

  const updated = await findUserById(id);
  if (!updated) throw new Error("用户不存在");
  return updated;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user?.passwordHash) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
