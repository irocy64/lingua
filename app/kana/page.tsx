import { KanaChart } from "@/features/kana/kana-chart";
import { requireUser } from "@/lib/access";

export const metadata = {
  title: "假名",
};

export const instant = false;

export default async function KanaPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">日语假名</h1>
      <p className="mt-1 text-sm text-slate-600">
        五十音清音表，平假名与片假名对照学习。
      </p>
      <div className="mt-6">
        <KanaChart />
      </div>
    </main>
  );
}
