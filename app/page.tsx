import Link from "next/link";

const features = [
  {
    title: "英语",
    desc: "CET-6 / 考研词汇、学术精读与口语对话，覆盖备考与表达。",
    tag: "CET-6 · 考研",
  },
  {
    title: "日语",
    desc: "假名、汉字、JLPT N5–N1 词汇与语法，体系化进阶。",
    tag: "JLPT N5–N1",
  },
  {
    title: "科学复习",
    desc: "FSRS 间隔重复算法调度，阅读生词自动沉淀为复习卡片。",
    tag: "FSRS",
  },
];

const loop = ["输入：阅读 / 听力", "沉淀：生词一键入库", "复习：FSRS 调度", "输出：口语 / 写作"];

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-5xl px-4">
        {/* Hero */}
        <section className="py-16 text-center sm:py-24">
          <p className="sci-kicker mb-4">LINGUA // NEURAL LANGUAGE OS</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            一个平台，精通英语与日语
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            以间隔重复为核心，打通阅读、背词、复习、口语的学习闭环。
            所有学习数据统一沉淀，让每一分钟都可追踪。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              开始学习
            </Link>
            <Link
              href="/decks"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              选择词书
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-16 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                {f.tag}
              </span>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Learning loop */}
        <section className="pb-24">
          <h2 className="text-center text-xl font-semibold text-slate-900">学习闭环</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {loop.map((step, i) => (
              <div key={step} className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
