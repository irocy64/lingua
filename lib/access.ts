import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { auth } from "@/lib/auth";

/** 当前登录用户在数据库中的记录（不判断状态） */
export async function getCurrentDbUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));
  return rows[0] ?? null;
}

/** 页面守卫：必须登录且已通过审核，否则跳转 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentDbUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/pending");
  return user;
}

/** 页面守卫：仅站点所有者 */
export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/dashboard");
  return user;
}

/** API 守卫：未登录 / 待审核 / 被禁用均返回 null */
export async function getActiveApiUser(): Promise<User | null> {
  const user = await getCurrentDbUser();
  if (!user || user.status !== "active") return null;
  return user;
}
