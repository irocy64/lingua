"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export function ImportExport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importLang, setImportLang] = useState<"en" | "ja">("en");
  const [result, setResult] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const tsv = await file.text();
    const res = await fetch("/api/import/anki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tsv, lang: importLang }),
    });
    const data = await res.json();
    setResult(res.ok ? `成功导入 ${data.imported} 个词` : "导入失败");
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-medium">导出到 Anki（TSV）</p>
        <div className="mt-2 flex gap-2">
          <a
            href="/api/export/anki?lang=en"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            导出英语
          </a>
          <a
            href="/api/export/anki?lang=ja"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            导出日语
          </a>
        </div>
      </div>

      <div>
        <p className="font-medium">从 Anki TSV 导入</p>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={importLang}
            onChange={(e) => setImportLang(e.target.value as "en" | "ja")}
            className="rounded-lg border border-slate-300 px-2 py-1.5"
          >
            <option value="en">英语</option>
            <option value="ja">日语</option>
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".tsv,.txt,.csv"
            onChange={handleFile}
            className="text-xs"
          />
        </div>
        {result && <p className="mt-2 text-xs text-emerald-600">{result}</p>}
      </div>

      <div>
        <Link href="/stats/graph" className="text-slate-700 hover:underline">
          查看词汇图谱 →
        </Link>
      </div>
    </div>
  );
}
