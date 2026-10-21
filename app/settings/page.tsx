import { connection } from "next/server";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/access";
import { syncBuiltinCards, updateSettings } from "@/server/account";
import { SettingsForm } from "@/features/auth/settings-form";

export const metadata = {
  title: "设置",
};

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const user = await requireUser();
  const userId = user.id;

  async function saveSettings(formData: FormData) {
    "use server";
    const nickname = String(formData.get("nickname") ?? "");
    const dailyNewTarget = Number(formData.get("dailyNewTarget"));
    const dailyReviewTarget = Number(formData.get("dailyReviewTarget"));

    await updateSettings(userId, {
      nickname,
      dailyNewTarget,
      dailyReviewTarget,
    });
  }

  async function syncDecks() {
    "use server";
    return syncBuiltinCards(userId);
  }

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold">设置</h1>
      <p className="mt-2 text-sm text-slate-500">
        登录账号：{user.email}
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 p-5">
        <SettingsForm
          defaultName={user.nickname ?? ""}
          defaultNewTarget={user.dailyNewTarget}
          defaultReviewTarget={user.dailyReviewTarget}
          save={saveSettings}
          sync={syncDecks}
        />
      </div>

      <form action={logout} className="mt-4">
        <button
          type="submit"
          className="text-sm text-slate-500 hover:text-rose-600"
        >
          退出登录
        </button>
      </form>
    </main>
  );
}
