"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SettingsForm({
  defaultName,
  defaultNewTarget,
  defaultReviewTarget,
  save,
  sync,
}: {
  defaultName: string;
  defaultNewTarget: number;
  defaultReviewTarget: number;
  save: (formData: FormData) => Promise<void>;
  sync: () => Promise<number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [nickname, setNickname] = useState(defaultName);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    startTransition(async () => {
      await save(formData);
      setSaved(true);
      router.refresh();
    });
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const added = await sync();
      setSyncMessage(
        added > 0
          ? `已同步 ${added} 个新词条到你的词库`
          : "词库已是最新，没有需要同步的词条"
      );
      router.refresh();
    } catch {
      setSyncMessage("同步失败，请稍后重试");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">昵称</label>
          <input
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">每日新词量</label>
            <input
              name="dailyNewTarget"
              type="number"
              min={1}
              max={100}
              defaultValue={defaultNewTarget}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">1–100，建议 10–20</p>
          </div>
          <div>
            <label className="block text-sm font-medium">每日复习量</label>
            <input
              name="dailyReviewTarget"
              type="number"
              min={10}
              max={500}
              defaultValue={defaultReviewTarget}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">10–500，建议 100</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存设置"}
        </button>
        {saved && (
          <p className="text-center text-xs text-emerald-600">已保存</p>
        )}
      </form>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-medium">内置词书同步</p>
        <p className="mt-1 text-xs text-slate-500">
          把新上线的内置词条补充到你的词库，已学过的词不会被覆盖。
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="mt-3 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {syncing ? "同步中…" : "同步内置词书"}
        </button>
        {syncMessage && (
          <p className="mt-2 text-center text-xs text-slate-500">{syncMessage}</p>
        )}
      </div>
    </div>
  );
}
