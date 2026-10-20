import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDashboardSummary } from "@/server/stats";
import { ImportExport } from "@/features/stats/import-export";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "仪表盘",
};

export const instant = false;

function heatColor(count: number) {
  if (count === 0) return "bg-slate-100";
  if (count < 5) return "bg-emerald-200";
  if (count < 15) return "bg-emerald-400";
  if (count < 30) return "bg-emerald-500";
  return "bg-emerald-700";
}

function ProgressBar({
  label,
  done,
  target,
  barClass,
}: {
  label: string;
  done: number;
  target: number;
  barClass: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const complete = done >= target;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{done}</span> / {target}
          {complete && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
              已完成
            </span>
          )}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const s = await getDashboardSummary(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      {/* 今日任务 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/study"
          className="rounded-xl border border-slate-200 p-6 hover:border-slate-400"
        >
          <p className="text-sm text-slate-500">今日待复习</p>
          <p className="mt-1 text-3xl font-bold">{s.dueCount}</p>
          <p className="mt-2 text-xs text-slate-400">
            今日已完成 {s.reviewed} / {s.dailyReviewTarget} · 点击开始复习
          </p>
        </Link>
        <Link
          href="/study"
          className="rounded-xl border border-slate-200 p-6 hover:border-slate-400"
        >
          <p className="text-sm text-slate-500">待学新词</p>
          <p className="mt-1 text-3xl font-bold">{s.newCount}</p>
          <p className="mt-2 text-xs text-slate-400">
            今日已学 {s.newLearned} / {s.dailyNewTarget} · 点击开始学习
          </p>
        </Link>
      </div>

      {/* 今日目标进度 */}
      <div className="mt-4 rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">今日目标</h2>
          <p className="text-xs text-slate-500">连续打卡 {s.streakDays} 天</p>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <ProgressBar
            label="新词学习"
            done={s.newLearned}
            target={s.dailyNewTarget}
            barClass="bg-emerald-500"
          />
          <ProgressBar
            label="到期复习"
            done={s.reviewed}
            target={s.dailyReviewTarget}
            barClass="bg-sky-500"
          />
        </div>
        <Link
          href="/settings"
          className="mt-4 inline-block text-xs text-slate-400 hover:text-slate-700"
        >
          调整每日目标 →
        </Link>
      </div>

      {/* 词汇统计 */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">学习中</p>
          <p className="mt-1 text-2xl font-bold">{s.learningCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">已掌握</p>
          <p className="mt-1 text-2xl font-bold">{s.masteredCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">今日评分</p>
          <p className="mt-1 text-2xl font-bold">{s.total}</p>
        </div>
      </div>

      {/* 近 30 天热力图 */}
      <div className="mt-6 rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold">近 30 天复习记录</h2>
        <div className="mt-4 grid grid-cols-10 gap-1.5">
          {s.last30Days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}：${d.count} 次`}
              className={`aspect-square rounded ${heatColor(d.count)}`}
            />
          ))}
        </div>
      </div>

      {/* 工具：Anki 互导、词汇图谱 */}
      <div className="mt-6 rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold">工具</h2>
        <div className="mt-4">
          <ImportExport />
        </div>
      </div>
    </main>
  );
}
