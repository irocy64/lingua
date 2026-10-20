import Link from "next/link";
import { redirect } from "next/navigation";
import { ImportForm } from "@/features/reader/import-form";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "导入文本",
};

export const instant = false;

export default async function NewTextPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/reader" className="text-sm text-slate-500 hover:text-slate-800">
        ← 返回阅读列表
      </Link>
      <h1 className="mt-3 text-2xl font-bold">导入文本</h1>
      <div className="mt-6">
        <ImportForm />
      </div>
    </main>
  );
}
