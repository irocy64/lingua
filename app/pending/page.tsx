import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { getCurrentDbUser } from "@/lib/access";
import { PendingWatcher } from "@/features/auth/pending-watcher";

export const metadata = {
  title: "等待审核",
};

export const instant = false;

export default async function PendingPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/login");
  if (user.status === "active") redirect("/dashboard");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const blocked = user.status === "blocked";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">{blocked ? "🚫" : "⏳"}</p>
      <h1 className="mt-4 text-2xl font-bold">
        {blocked ? "账号已被禁用" : "账号等待管理员审核"}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {blocked
          ? "如需恢复使用，请联系站点管理员。"
          : "注册成功。这个站点是私人学习空间，需要管理员通过后才能使用。"}
      </p>
      <p className="mt-2 text-xs text-slate-400">当前账号：{user.email}</p>
      {!blocked && <PendingWatcher />}
      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          退出登录
        </button>
      </form>
    </main>
  );
}
