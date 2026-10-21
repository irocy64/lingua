import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireOwner } from "@/lib/access";
import { ensureDeckCards } from "@/server/decks";

export const metadata = {
  title: "用户管理",
};

export const instant = false;

export default async function AdminUsersPage() {
  await connection();
  const owner = await requireOwner();

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const ordered = [
    ...allUsers.filter((user) => user.status !== "active"),
    ...allUsers.filter((user) => user.status === "active"),
  ];
  const pendingCount = allUsers.filter((user) => user.status === "pending").length;

  async function approve(formData: FormData) {
    "use server";
    await requireOwner();
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;
    await db
      .update(users)
      .set({ status: "active" })
      .where(eq(users.id, userId));
    await ensureDeckCards(userId, "builtin-cet6", 300);
    revalidatePath("/admin/users");
  }

  async function disable(formData: FormData) {
    "use server";
    await requireOwner();
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;
    await db
      .update(users)
      .set({ status: "blocked" })
      .where(eq(users.id, userId));
    revalidatePath("/admin/users");
  }

  const statusLabel: Record<string, string> = {
    pending: "待审核",
    active: "已通过",
    blocked: "已禁用",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="sci-kicker mb-1">ACCESS CONTROL</p>
          <h1 className="text-2xl font-bold">用户管理</h1>
        </div>
        <p className="text-sm text-slate-500">
          待审核 {pendingCount} 人 · 共 {allUsers.length} 人
        </p>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        新注册账号默认不可用。通过审核后，对方重新登录即可使用，并自动发放 300 个
        CET-6 起步词。
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">邮箱</th>
              <th className="px-4 py-2 font-medium">昵称</th>
              <th className="px-4 py-2 font-medium">状态</th>
              <th className="px-4 py-2 font-medium">注册时间</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  {user.email}
                  {user.role === "owner" && (
                    <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">
                      你
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {user.nickname ?? "-"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : user.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {statusLabel[user.status] ?? user.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {user.createdAt.toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-2">
                  {user.id === owner.id ? (
                    <span className="text-xs text-slate-400">当前管理员</span>
                  ) : (
                    <div className="flex gap-2">
                      {user.status !== "active" && (
                        <form action={approve}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                          >
                            通过
                          </button>
                        </form>
                      )}
                      {user.status === "active" && (
                        <form action={disable}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            禁用
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allUsers.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">暂无注册用户。</p>
      )}
    </main>
  );
}
