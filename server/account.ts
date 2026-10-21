import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { ensureDeckCards, syncJoinedDeckCards } from "@/server/decks";

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return rows[0];
}

export async function findUserById(id: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows[0];
}

/**
 * 同步用户已加入的内置词书（补齐模板中新增的词，不覆盖学习进度）。
 * @returns 本次新增的卡片数量
 */
export async function syncBuiltinCards(userId: string): Promise<number> {
  return syncJoinedDeckCards(userId);
}

/** 为新用户准备第一批 CET-6 词（按需分批加载，避免注册时写入上万条） */
async function provisionUserCards(userId: string): Promise<void> {
  await ensureDeckCards(userId, "builtin-cet6", 300);
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
  const ownerEmail = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
  const isOwner = ownerEmail.length > 0 && normalized === ownerEmail;

  await db.insert(users).values({
    id,
    email: normalized,
    passwordHash,
    nickname: nickname ?? normalized.split("@")[0],
    status: isOwner ? "active" : "pending",
    role: isOwner ? "owner" : "user",
  });

  // 待审核用户不预置词书，审批通过后再发放，避免白占存储
  if (isOwner) {
    await provisionUserCards(id);
  }

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
