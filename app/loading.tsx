export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-10">
      <div className="h-7 w-40 rounded bg-slate-100" />
      <div className="mt-3 h-3 w-72 rounded bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-slate-200 p-5"
          >
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
